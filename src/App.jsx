import React, { useCallback, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { cloneSudoku } from './sudoku-lib.js';

// some style params
let grey = '#cccccc';
let darkGrey = '#999999';
let lightGrey = '#f6f6f6';
let thin = `${grey} solid 1px`;
let sudokuWidth = 450;
let rightColumnWidth = 275;

let Sudoku; // this will hold the dynamically imported './sudoku-zkapp.ts'

render(<App />, document.querySelector('#root'));

function App() {
  let [zkapp, setZkapp] = useState();
  let [ease, setEase] = useState(0.5);

  let [view, setView] = useState(1);
  let goForward = () => setView(2);
  let goBack = () => setView(1);
  return (
    <Container>
      {view === 1 ? (
        <GenerateSudoku {...{ setZkapp, ease, setEase, goForward }} />
      ) : (
        <SolveSudoku {...{ zkapp, goBack }} />
      )}
    </Container>
  );
}

function GenerateSudoku({ setZkapp, goForward }) {
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

function SolveSudoku({ zkapp, goBack }) {
  let [sudoku, setSudoku] = useState(() => Array(7).fill().map(() => Array(7).fill(0)));
  let [zkappState, pullZkappState] = useZkappState(zkapp);

  let [isLoading, setLoading] = useState(false);

  async function submit() {
    if (isLoading) return;
    setLoading(true);
    await zkapp.validateSolution(sudoku);
    pullZkappState();
    setLoading(false);
  }

  return (
    <Layout>
      <Header goBack={goBack}>Step 2. Create and verify your map layout</Header>
      <SudokuTable
        sudoku={sudoku}
        setSudoku={setSudoku}
      />

      <div style={{ width: rightColumnWidth + 'px' }}>
        <div>You must place exactly 10 ships.</div>

        <Button onClick={submit} disabled={isLoading}>
          Submit solution
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
  let { sudokuHash = '', isSolved = false } = state;
  return (
    <div
      style={{
        backgroundColor: lightGrey,
        border: thin,
        padding: '8px',
      }}
    >
      <pre style={{ display: 'flex', justifyContent: 'space-between' }}>
        <b>sudokuHash</b>
        <span
          title={sudokuHash}
          style={{
            width: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sudokuHash}
        </span>
      </pre>
      <Space h=".5rem" />
      <pre style={{ display: 'flex', justifyContent: 'space-between' }}>
        <b>isSolved</b>
        <span style={{ color: isSolved ? 'green' : 'red' }}>
          {isSolved.toString()}
        </span>
      </pre>
    </div>
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

function SudokuTable({ sudoku, setSudoku }) {
  let cellSize = sudokuWidth / 9 + 'px';

  return (
    <table
      style={{
        border: thin,
        borderCollapse: 'collapse',
      }}
    >
      <tbody>
        {sudoku.map((row, i) => (
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
                  let newSudoku = cloneSudoku(sudoku);
                  newSudoku[i][j] = x === 0 ? 1 : 0;
                  setSudoku(newSudoku);
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
