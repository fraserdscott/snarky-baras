import {
  matrixProp,
  CircuitValue,
  Field,
  SmartContract,
  PublicKey,
  method,
  PrivateKey,
  Mina,
  Bool,
  state,
  State,
  isReady,
  Poseidon,
  Party
} from 'snarkyjs';
import { tic, toc } from './tictoc';

export { deploy };

await isReady;

export const BOARD_WIDTH = 7;
export const CAPY_COUNT = 10;

class Sudoku extends CircuitValue {
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
  @state(Bool) isSolved = State<Bool>();

  // Check that the instance is valid
  @method validateSolution(sudokuInstance: Sudoku) {
    let sudoku = sudokuInstance.value;

    let sum = Field(0);
    for (let i = 0; i < BOARD_WIDTH; i++) {
      for (let j = 0; j < BOARD_WIDTH; j++) {
        sum = sum.add(sudoku[i][j]);
      }
    }
    sum.assertEquals(CAPY_COUNT);

    this.isSolved.set(Bool(true));
  }
}

// setup
const Local = Mina.LocalBlockchain();
Mina.setActiveInstance(Local);
let feePayer = Local.testAccounts[0].privateKey;

type SudokuInterface = {
  sudoku: number[][];
  validateSolution(solution: number[][]): Promise<void>;
  getState(): { sudokuHash: string; isSolved: boolean };
};
let isDeploying = null as null | SudokuInterface;

async function deploy() {
  if (isDeploying) return isDeploying;

  let zkappKey = PrivateKey.random();
  let zkappAddress = zkappKey.toPublicKey();
  tic('compile');
  let { verificationKey } = await SudokuZkapp.compile(zkappAddress);
  toc();

  let zkappInterface = {
    validateSolution(sudoku: number[][]) {
      return validateSolution(zkappAddress, sudoku);
    },
    getState() {
      return getState(zkappAddress);
    },
  };

  let zkapp = new SudokuZkapp(zkappAddress);
  let tx = await Mina.transaction(feePayer, () => {
    Party.fundNewAccount(feePayer);
    zkapp.deploy({ zkappKey, verificationKey });
  });
  await tx.send().wait();

  isDeploying = null;
  return zkappInterface;
}

async function validateSolution(
  zkappAddress: PublicKey,
  sudoku: number[][]
) {
  let zkapp = new SudokuZkapp(zkappAddress);
  try {
    let tx = await Mina.transaction(feePayer, () => {
      zkapp.validateSolution(new Sudoku(sudoku));
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
  return {};
}