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
  AccountUpdate
} from 'snarkyjs';
import { tic, toc } from './tictoc';

export { deploy };

await isReady;

export const BOARD_WIDTH = 7;
export const CAPY_COUNT = 10;

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

  @method setBoard1(boardInstance: Board) {
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
  }

  @method setBoard2(boardInstance: Board) {
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
  }
}

// setup
const Local = Mina.LocalBlockchain();
Mina.setActiveInstance(Local);
let feePayer = Local.testAccounts[0].privateKey;

type BoardInterface = {
  setBoard(board: number[][]): Promise<void>;
  getState(): { commitment1: string; commitment2: string };
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
    setBoard(board: number[][], player: number) {
      return setBoard(zkappAddress, board, player);
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

async function setBoard(
  zkappAddress: PublicKey,
  sudoku: number[][],
  player: number
) {
  let zkapp = new SudokuZkapp(zkappAddress);
  try {
    let tx = await Mina.transaction(feePayer, () => {
      player === 1 ? zkapp.setBoard1(new Board(sudoku)) : zkapp.setBoard2(new Board(sudoku));
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

  return { commitment1, commitment2 };
}

function fieldToHex(field: Field) {
  return BigInt(field.toString()).toString(16);
}