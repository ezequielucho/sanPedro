const socket = io();

socket.on('escucho', (data)=>{
    alert(data);
});