const socket = io();

socket.on('escucho', (data)=>{
    console.log(data);
    alert("¡HOLA A TODOS!");
});

socket.on('test', (data)=>{
    console.log(data);
});