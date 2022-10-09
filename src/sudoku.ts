import {
  matrixProp,
  CircuitValue,
  Field,
  SmartContract,
  PublicKey,
  method,
  PrivateKey,
  Mina,
  state,
  State,
  isReady,
  Poseidon,
  AccountUpdate,
  Bool,
  Circuit
} from 'snarkyjs';
import { tic, toc } from './tictoc';

export { deploy };

await isReady;

export const BOARD_WIDTH = 4;
export const CAPY_COUNT = 3;

class Board extends CircuitValue {
  @matrixProp(Field, BOARD_WIDTH, BOARD_WIDTH) value: Field[][];

  constructor(value: number[][]) {
    super();
    this.value = value.map((row) => row.map(Field));
  }

  hash() {
    return Poseidon.hash(this.value.flat());
  }
}

class SudokuZkapp extends SmartContract {
  @state(Field) commitment1 = State<Field>();
  @state(Field) commitment2 = State<Field>();

  @state(Field) hits1 = State<Field>();
  @state(Field) hits2 = State<Field>();

  @state(Field) guessX = State<Field>();
  @state(Field) guessY = State<Field>();

  @state(Field) turn = State<Field>();

  @method setBoard1(boardInstance: Board) {
    this.commitment1.assertEquals(Field(0));
    this.commitment2.assertEquals(Field(0));

    let board = boardInstance.value;

    let sum = Field(0);
    for (let i = 0; i < BOARD_WIDTH; i++) {
      for (let j = 0; j < BOARD_WIDTH; j++) {
        sum = sum.add(board[i][j]);
      }
    }
    sum.assertEquals(CAPY_COUNT);

    this.commitment1.set(boardInstance.hash());
    this.turn.set(Field(2));
  }

  @method setBoard2(boardInstance: Board, x: Field, y: Field) {
    this.turn.assertEquals(Field(2));
    this.commitment2.assertEquals(Field(0));

    let board = boardInstance.value;

    let sum = Field(0);
    for (let i = 0; i < BOARD_WIDTH; i++) {
      for (let j = 0; j < BOARD_WIDTH; j++) {
        sum = sum.add(board[i][j]);
      }
    }
    sum.assertEquals(CAPY_COUNT);

    this.commitment2.set(boardInstance.hash());
    this.guessX.set(x);
    this.guessY.set(y);
    this.turn.set(Field(1));
  }

  @method isHit1(boardInstance: Board, x: Field, y: Field) {
    this.turn.assertEquals(Field(1)); // TODO check that both commitments have been made

    this.commitment1.assertEquals(boardInstance.hash());

    this.guessX.assertEquals(this.guessX.get());
    this.guessY.assertEquals(this.guessY.get());
    this.hits1.assertEquals(this.hits1.get());

    let board = boardInstance.value;

    // We need to know if tiles have been hit before, so we know not to increment this counter
    // Maintain a Board of "hit" positions
    let isNotHit = Bool(true);
    for (let i = 0; i < BOARD_WIDTH; i++) {
      for (let j = 0; j < BOARD_WIDTH; j++) {
        const guessXLocal = this.guessX.get();
        const guessYLocal = this.guessY.get();

        const isGuess = guessXLocal.equals(i).and(guessYLocal.equals(j));
        const isHit = isGuess.and(board[i][j].equals(1));

        isNotHit = isHit.not().and(isNotHit);
      }
    }

    // make hits a board, or commitment to a board
    this.hits1.set(Circuit.if(isNotHit, this.hits1.get(), this.hits1.get().add(Field(1))));
    this.guessX.set(x);
    this.guessY.set(y);
    this.turn.set(Field(2));
  }

  @method isHit2(boardInstance: Board, x: Field, y: Field) {
    this.turn.assertEquals(Field(2)); // TODO check that both commitments have been made

    this.commitment2.assertEquals(boardInstance.hash());

    this.guessX.assertEquals(this.guessX.get());
    this.guessY.assertEquals(this.guessY.get());
    this.hits2.assertEquals(this.hits2.get());

    let board = boardInstance.value;

    // Check that hit correpsonde with newHitBoardInstance (all zeros except 1)
    let isNotHit = Bool(true);
    for (let i = 0; i < BOARD_WIDTH; i++) {
      for (let j = 0; j < BOARD_WIDTH; j++) {
        const guessXLocal = this.guessX.get();
        const guessYLocal = this.guessY.get();

        const isGuess = guessXLocal.equals(i).and(guessYLocal.equals(j));
        const isHit = isGuess.and(board[i][j].equals(1));

        isNotHit = isHit.not().and(isNotHit);
      }
    }

    this.hits2.set(Circuit.if(isNotHit, this.hits2.get(), this.hits2.get().add(Field(1))));
    // TODO: check that hitBoard and newHitBoard only differ by 1
    this.guessX.set(x);
    this.guessY.set(y);
    this.turn.set(Field(1));
  }
}

// setup
const Local = Mina.LocalBlockchain();
Mina.setActiveInstance(Local);
let feePayer = Local.testAccounts[0].privateKey;

type BoardInterface = {
  setBoard1(board: number[][]): Promise<void>;
  setBoard2(board: number[][], x: number, y: number): Promise<void>;
  isHit(board: number[][], player: number, x: number, y: number): Promise<void>;
  getState(): { commitment1: string; commitment2: string, hits1: string, hits2: string, turn: string, guessX: string, guessY: string };
};
let isDeploying = null as null | BoardInterface;

async function deploy() {
  if (isDeploying) return isDeploying;

  let zkappKey = PrivateKey.random();
  let zkappAddress = zkappKey.toPublicKey();
  tic('compile');
  let { verificationKey } = await SudokuZkapp.compile();
  toc();

  let zkappInterface = {
    setBoard1(board: number[][]) {
      return setBoard1(zkappAddress, board);
    },
    setBoard2(board: number[][], guessX: number, guessY: number) {
      return setBoard2(zkappAddress, board, guessX, guessY);
    },
    isHit(board: number[][], player: number, x: number, y: number) {
      return isHit(zkappAddress, board, player, x, y);
    },
    getState() {
      return getState(zkappAddress);
    },
  };

  let zkapp = new SudokuZkapp(zkappAddress);
  let tx = await Mina.transaction(feePayer, () => {
    AccountUpdate.fundNewAccount(feePayer);
    zkapp.deploy({ zkappKey, verificationKey });
  });
  await tx.send().wait();

  isDeploying = null;
  return zkappInterface;
}

async function setBoard1(
  zkappAddress: PublicKey,
  board: number[][]
) {
  let zkapp = new SudokuZkapp(zkappAddress);
  try {
    let tx = await Mina.transaction(feePayer, () => {
      zkapp.setBoard1(new Board(board));
    });
    tic('prove');
    await tx.prove();
    toc();
    await tx.send().wait();
  } catch (err) {
    console.log('Solution rejected!');
    console.error(err);
  }
}

async function setBoard2(
  zkappAddress: PublicKey,
  board: number[][],
  x: number,
  y: number
) {
  let zkapp = new SudokuZkapp(zkappAddress);
  try {
    let tx = await Mina.transaction(feePayer, () => {
      zkapp.setBoard2(new Board(board), Field(x), Field(y));
    });
    tic('prove');
    await tx.prove();
    toc();
    await tx.send().wait();
  } catch (err) {
    console.log('Solution rejected!');
    console.error(err);
  }
}

async function isHit(
  zkappAddress: PublicKey,
  board: number[][],
  player: number,
  x: number,
  y: number
) {
  let zkapp = new SudokuZkapp(zkappAddress);
  try {
    let tx = await Mina.transaction(feePayer, () => {
      player === 1 ? zkapp.isHit1(new Board(board), Field(x), Field(y)) : zkapp.isHit2(new Board(board), Field(x), Field(y));
    });
    tic('prove');
    await tx.prove();
    toc();
    await tx.send().wait();
  } catch (err) {
    console.log('Solution rejected!');
    console.error(err);
  }
}

function getState(zkappAddress: PublicKey) {
  let zkapp = new SudokuZkapp(zkappAddress);
  let commitment1 = fieldToHex(zkapp.commitment1.get());
  let commitment2 = fieldToHex(zkapp.commitment2.get());
  let hits1 = zkapp.hits1.get().toString();
  let hits2 = zkapp.hits2.get().toString();
  let turn = zkapp.turn.get().toString();
  let guessX = zkapp.guessX.get().toString();
  let guessY = zkapp.guessY.get().toString();

  return { commitment1, commitment2, hits1, hits2, turn, guessX, guessY };
}

function fieldToHex(field: Field) {
  return BigInt(field.toString()).toString(16);
}