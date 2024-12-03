async function gamelooptest() {
        const response = await fetch('http://127.0.0.1:3000/easterner');
        const data = await response.json();
        console.log(data);
}
gamelooptest()