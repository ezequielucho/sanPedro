const socket = io();

socket.on('escucho', (data)=>{
    console.log(data);
});