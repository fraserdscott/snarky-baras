import React, { useCallback, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { BOARD_WIDTH, CAPY_COUNT } from '../dist/sudoku.js';
import { cloneSudoku } from './sudoku-lib.js';

// some style params
let grey = '#cccccc';
let darkGrey = '#999999';
let lightGrey = '#f6f6f6';
let thin = `${grey} solid 1px`;
let gridWidth = 450;
let rightColumnWidth = 275;

let Sudoku; // this will hold the dynamically imported './sudoku-zkapp.ts'

render(<App />, document.querySelector('#root'));

function App() {
  let [zkapp, setZkapp] = useState();
  let [zkappState, pullZkappState] = useZkappState(zkapp);

  return (
    <Container>
      <ZkappState state={zkappState} />
      {zkappState ? (
        zkappState.commitment1 === "0" && zkappState.commitment2 === "0" ? (
          <SetBoard1 {...{ zkapp }} pullZkappState={pullZkappState} />
        ) : zkappState.commitment1 !== "0" && zkappState.commitment2 === "0" ? (
          <SetBoard2 {...{ zkapp }} pullZkappState={pullZkappState} />
        ) : (
          <HitBoard {...{ zkapp }} pullZkappState={pullZkappState} />
        )) : (
        <DeployContract {...{ setZkapp }} />
      )}
    </Container>
  );
}

function DeployContract({ setZkapp }) {
  let [isLoading, setLoading] = useState(false);

  async function deploy() {
    if (isLoading) return;
    setLoading(true);
    Sudoku = await import('../dist/sudoku.js');
    let zkapp = await Sudoku.deploy();
    setLoading(false);
    setZkapp(zkapp);
  }

  return (
    <Layout>
      <Header>Step 1. Deploy the contract</Header>

      <Button onClick={deploy} disabled={isLoading}>
        Deploy
      </Button>
    </Layout>
  );
}

function SetBoard1({ zkapp, pullZkappState }) {
  let [board, setBoard] = useState(() => Array(BOARD_WIDTH).fill().map(() => Array(BOARD_WIDTH).fill(0)));
  let [isLoading, setLoading] = useState(false);

  async function submit() {
    if (isLoading) return;
    setLoading(true);
    await zkapp.setBoard1(board);
    pullZkappState();
    setLoading(false);
  }

  return (
    <Layout>
      <Header>Player 1: set map layout</Header>

      <Board
        board={board}
        setBoard={setBoard}
      />

      <div style={{ width: rightColumnWidth + 'px' }}>
        <Space h="2.5rem" />
        <div>You must place exactly {CAPY_COUNT} ships.</div>

        <Button onClick={submit} disabled={isLoading}>
          Set layout
        </Button>
      </div>
    </Layout>
  );
}

function SetBoard2({ zkapp, pullZkappState }) {
  let [board, setBoard] = useState(() => Array(BOARD_WIDTH).fill().map(() => Array(BOARD_WIDTH).fill(0)));
  let [isLoading, setLoading] = useState(false);
  let [choice, setChoice] = useState([0, 0]);

  async function submit() {
    if (isLoading) return;
    setLoading(true);
    await zkapp.setBoard2(board, choice[0], choice[1]);
    pullZkappState();
    setLoading(false);
  }

  return (
    <div>
      <Header>Player 2: set map layout</Header>

      <Board
        board={board}
        setBoard={setBoard}
      />

      <SelectBoard choice={choice} setChoice={setChoice} />
      <div style={{ width: rightColumnWidth + 'px' }}>
        <Space h="2.5rem" />
        <div>You must place exactly {CAPY_COUNT} ships.</div>

        <Button onClick={submit} disabled={isLoading}>
          Submit
        </Button>
      </div>

    </div>
  );
}

function HitBoard({ zkapp, pullZkappState }) {
  let [board, setBoard] = useState(() => Array(BOARD_WIDTH).fill().map(() => Array(BOARD_WIDTH).fill(0)));
  let [isLoading, setLoading] = useState(false);

  async function submit() {
    if (isLoading) return;
    setLoading(true);
    await zkapp.isHit(board);
    pullZkappState();
    setLoading(false);
  }

  return (
    <Layout>
      <Header>Player 1 prove that you have or have not been hit</Header>

      <Board
        board={board}
        setBoard={setBoard}
      />

      <div style={{ width: rightColumnWidth + 'px' }}>
        <Space h="2.5rem" />

        <Button onClick={submit} disabled={isLoading}>
          Prove
        </Button>
      </div>
    </Layout>
  );
}

function useZkappState(zkapp) {
  let [state, setState] = useState();
  let pullZkappState = useCallback(() => {
    let state = zkapp?.getState();
    setState(state);
    return state;
  }, [zkapp]);
  useEffect(() => {
    setState(zkapp?.getState());
  }, [zkapp]);
  return [state, pullZkappState];
}

function ZkappState({ state = {} }) {
  let { commitment1 = '', commitment2 = '', winner = '' } = state;
  return (
    <div
      style={{
        backgroundColor: lightGrey,
        border: thin,
        padding: '8px',
      }}
    >
      <pre style={{ display: 'flex', justifyContent: 'space-between' }}>
        <b>commitment1</b>
        <span
          title={commitment1}
          style={{
            width: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {commitment1}
        </span>
      </pre>
      <Space h=".5rem" />
      <pre style={{ display: 'flex', justifyContent: 'space-between' }}>
        <b>commitment2</b>
        <span
          title={commitment2}
          style={{
            width: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {commitment2}
        </span>
      </pre>
      <Space h=".5rem" />
      <pre style={{ display: 'flex', justifyContent: 'space-between' }}>
        <b>winner</b>
        <span
          title={winner}
          style={{
            width: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {winner}
        </span>
      </pre>
    </div>
  );
}

// pure UI components

function Header({ children }) {
  return (
    <div style={{ position: 'relative' }}>
      <h1 style={{ fontSize: '36px', textAlign: 'center' }}>{children}</h1>
    </div>
  );
}

function Board({ board, setBoard }) {
  let cellSize = gridWidth / 9 + 'px';

  return (
    <table
      style={{
        border: thin,
        borderCollapse: 'collapse'
      }}
    >
      <tbody>
        {board.map((row, i) => (
          <tr key={i}>
            {row.map((x, j) => (
              <td
                key={j}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRight: thin,
                  borderBottom: thin,
                }}
              > <button
                style={{
                  width: '100%',
                  height: '100%',
                  textAlign: 'center',
                  backgroundColor: lightGrey,
                  border: thin,
                }}
                onClick={() => {
                  let newBoard = cloneSudoku(board);
                  newBoard[i][j] = x === 0 ? 1 : 0;
                  setBoard(newBoard);
                }}
              >{x === 1 ? '🛳' : '🌊'}</button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SelectBoard({ choice, setChoice }) {
  let cellSize = gridWidth / 9 + 'px';

  return (
    <table
      style={{
        border: thin,
        borderCollapse: 'collapse'
      }}
    >
      <tbody>
        {Array(BOARD_WIDTH).fill().map(() => Array(BOARD_WIDTH).fill(0)).map((row, i) => (
          <tr key={i}>
            {row.map((x, j) => (
              <td
                key={j}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRight: thin,
                  borderBottom: thin,
                }}
              > <button
                style={{
                  width: '100%',
                  height: '100%',
                  textAlign: 'center',
                  backgroundColor: lightGrey,
                  border: thin,
                }}
                onClick={() => {
                  setChoice([i, j]);
                }}
              >{i === choice[0] && j === choice[1] ? 'X' : '?'}</button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Button({ disabled = false, ...props }) {
  return (
    <button
      className="highlight"
      style={{
        color: disabled ? darkGrey : 'black',
        fontSize: '1rem',
        fontWeight: 'bold',
        backgroundColor: disabled ? 'white !important' : 'white',
        borderRadius: '10px',
        paddingTop: '10px',
        paddingBottom: '10px',
        width: '100%',
        border: disabled ? `4px ${darkGrey} solid` : '4px black solid',
        boxShadow: `${grey} 3px 3px 3px`,
        cursor: disabled ? undefined : 'pointer',
      }}
      disabled={disabled}
      {...props}
    />
  );
}

function Container(props) {
  return (
    <div
      style={{
        maxWidth: '900px',
        margin: 'auto',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: '2rem',
      }}
      {...props}
    />
  );
}

function Layout({ children }) {
  let [header, left, right] = children;
  return (
    <>
      {header}
      <Space h="4rem" />
      <div style={{ display: 'flex' }}>
        {left}
        <Space w="4rem" />
        {right}
      </div>
    </>
  );
}

function Space({ w, h }) {
  return <div style={{ width: w, height: h }} />;
}
