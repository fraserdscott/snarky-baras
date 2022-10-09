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

let Sudoku; // this will hold the dynamically imported './sudoku-zkapp.ts'

render(<App />, document.querySelector('#root'));

function App() {
  let [zkapp, setZkapp] = useState();
  let [zkappState, pullZkappState] = useZkappState(zkapp);
  let [board1, setBoard1] = useState(() => Array(BOARD_WIDTH).fill().map(() => Array(BOARD_WIDTH).fill(0)));
  let [board2, setBoard2] = useState(() => Array(BOARD_WIDTH).fill().map(() => Array(BOARD_WIDTH).fill(0)));
  let [hits1, setHits1] = useState(() => Array(BOARD_WIDTH).fill().map(() => Array(BOARD_WIDTH).fill(0)));
  let [hits2, setHits2] = useState(() => Array(BOARD_WIDTH).fill().map(() => Array(BOARD_WIDTH).fill(0)));

  return (
    <Container>
      {zkappState ? (
        zkappState.commitment1 === "0" && zkappState.commitment2 === "0" ? (
          <SetBoard1 {...{ zkapp, board: board1, setBoard: setBoard1 }} pullZkappState={pullZkappState} />
        ) : zkappState.commitment1 !== "0" && zkappState.commitment2 === "0" ? (
          <SetBoard2 {...{ zkapp, board: board2, setBoard: setBoard2, hits1, setHits1 }} pullZkappState={pullZkappState} />
        ) : (
          <HitBoard {...{
            zkapp, player: parseInt(zkappState.turn),
            board: zkappState.turn === "1" ? board1 : board2,
            hits1,
            hits2,
            setHits1,
            setHits2
          }} pullZkappState={pullZkappState} />
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
      <Header>Step 1: Deploy the contract</Header>

      <Button onClick={deploy} disabled={isLoading}>
        Deploy
      </Button>
    </Layout>
  );
}

function SetBoard1({ zkapp, board, setBoard, pullZkappState }) {
  let [isLoading, setLoading] = useState(false);

  async function submit() {
    if (isLoading) return;
    setLoading(true);
    await zkapp.setBoard1(board);
    pullZkappState();
    setLoading(false);
  }

  return (
    <div>
      <Header>{"Player 1's turn"}</Header>

      <div>
        <h2>Player 1</h2>
        <div>You must place exactly {CAPY_COUNT} capys.</div>

        <EditBoard
          board={board}
          setBoard={setBoard}
        />
      </div>

      <Button onClick={submit} disabled={isLoading}>
        Submit
      </Button>
    </div>
  );
}

function SetBoard2({ zkapp, pullZkappState, board, setBoard, hits1, setHits1 }) {
  let [isLoading, setLoading] = useState(false);
  let [choice, setChoice] = useState([0, 0]);

  async function submit() {
    if (isLoading) return;
    setLoading(true);
    await zkapp.setBoard2(board, choice[0], choice[1]);

    let newBoard = cloneSudoku(hits1);
    newBoard[choice[0]][choice[1]] = 1;
    setHits1(newBoard);

    pullZkappState();
    setLoading(false);
  }

  return (
    <div>
      <Header>{"Player 2's turn"}</Header>

      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div>
          <h2>Player 1</h2>
          <SelectBoard choice={choice} setChoice={setChoice} hitsBoard={hits1} />
        </div>

        <div>
          <h2>Player 2</h2>
          <div>You must place exactly {CAPY_COUNT} capys.</div>

          <EditBoard
            board={board}
            setBoard={setBoard}
          />
        </div>
      </div>

      <Button onClick={submit} disabled={isLoading}>
        Submit
      </Button>
    </div>
  );
}

function HitBoard({ zkapp, pullZkappState, player, board, hits1, hits2, setHits1, setHits2 }) {
  let [choice, setChoice] = useState([0, 0]);
  let [isLoading, setLoading] = useState(false);

  async function submit() {
    if (isLoading) return;
    setLoading(true);
    await zkapp.isHit(board, player, choice[0], choice[1]);

    if (player === 1) {
      let newBoard = cloneSudoku(hits2);
      newBoard[choice[0]][choice[1]] = 1;
      setHits2(newBoard);
    } else {
      let newBoard = cloneSudoku(hits1);
      newBoard[choice[0]][choice[1]] = 1;
      setHits1(newBoard);
    }

    pullZkappState();
    setLoading(false);
  }

  return (
    <div>
      <Header>{`Player ${player}'s turn`}</Header>
      <div style={{ display: 'flex', flexDirection: 'row', alignContent: 'space-around' }}>
        <div>
          <h2>Player 1 {player === 1 ? "(You)" : ""}</h2>
          {
            player === 1 ? <DisplayBoard board={board} hitsBoard={hits1} />
              : <SelectBoard choice={choice} setChoice={setChoice} hitsBoard={hits1} />
          }
        </div>

        <div>
          <h2>Player 2 {player === 2 ? "(You)" : ""}</h2>
          {
            player === 2 ? <DisplayBoard
              board={board}
              hitsBoard={hits2}
            /> : <SelectBoard choice={choice} setChoice={setChoice} hitsBoard={hits2} />
          }
        </div>
      </div>

      <Button onClick={submit} disabled={isLoading}>
        Submit
      </Button>
    </div>
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

// pure UI components

function Header({ children }) {
  return (
    <div style={{ position: 'relative' }}>
      <h1 style={{ fontSize: '36px', textAlign: 'center' }}>{children}</h1>
    </div>
  );
}

function DisplayBoard({ board, hitsBoard }) {
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
                  backgroundColor: (hitsBoard[i][j] === 1 ? 'maroon' : lightGrey),
                  border: thin,
                }}
              >{x === 1 ? '🦫' : '🌊'}</button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EditBoard({ board, setBoard }) {
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
              >{x === 1 ? '🦫' : '🌊'}</button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SelectBoard({ choice, setChoice, hitsBoard }) {
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
                  backgroundColor: (hitsBoard[i][j] === 1 ? 'maroon' : lightGrey),
                  border: thin,
                }}
                onClick={() => {
                  setChoice([i, j]);
                }}
              >{i === choice[0] && j === choice[1] ? '🔫' : '❓'}</button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table >
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
