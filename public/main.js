const socket = io();
var test = null;
socket.on('escucho', (data)=>{
    console.log(data);
    alert("¡HOLA A TODOS!");
});

socket.on('test', (data)=>{
    test = data;
    console.log(data);
});