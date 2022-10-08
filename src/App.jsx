import React, { useState } from 'react';
import { render } from 'react-dom';
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

  let [view, setView] = useState(1);
  let goForward = () => setView(2);
  let goBack = () => setView(1);
  return (
    <Container>
      {view === 1 ? (
        <DeployContract {...{ setZkapp, goForward }} />
      ) : (
        <VerifyBoard {...{ zkapp, goBack }} />
      )}
    </Container>
  );
}

function DeployContract({ setZkapp, goForward }) {
  let [isLoading, setLoading] = useState(false);

  async function deploy() {
    if (isLoading) return;
    setLoading(true);
    Sudoku = await import('../dist/sudoku.js');
    let zkapp = await Sudoku.deploy();
    setLoading(false);
    setZkapp(zkapp);
    goForward();
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

function VerifyBoard({ zkapp, goBack }) {
  let [board, setBoard] = useState(() => Array(7).fill().map(() => Array(7).fill(0)));

  let [isLoading, setLoading] = useState(false);

  async function submit() {
    if (isLoading) return;
    setLoading(true);
    await zkapp.validateSolution(board);
    setLoading(false);
  }

  return (
    <Layout>
      <Header goBack={goBack}>Step 2. Verify your map layout</Header>
      <Board
        board={board}
        setBoard={setBoard}
      />

      <div style={{ width: rightColumnWidth + 'px' }}>
        <div>You must place exactly 10 ships.</div>

        <Button onClick={submit} disabled={isLoading}>
          Verify layout
        </Button>
      </div>
    </Layout>
  );
}

// pure UI components

function Header({ goBack, children }) {
  return (
    <div style={{ position: 'relative' }}>
      <h1 style={{ fontSize: '36px', textAlign: 'center' }}>{children}</h1>
      {goBack && (
        <div
          onClick={goBack}
          title="Back to step 1"
          style={{
            position: 'absolute',
            cursor: 'pointer',
            left: '25px',
            top: 0,
            fontSize: '40px',
          }}
        >
          👈
        </div>
      )}
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
