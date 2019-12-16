<?php
$servername = "silema.hiterp.com";
$username = "sa";
$password = "LOperas93786";
$dbname = "fac_tena";
$id_producto = $_GET['id'];
$producto = $_GET['producto'];
// Creamos la conexión
$conn = new mysqli($servername, $username, $password, $dbname);
// Check de la conexión
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
$valor = "SELECT codi FROM articles a join ArticlesPropietats p on a.codi = p.CodiArticle and p.Variable = 'CODI_PROD' and valor = '$id_producto'";
//$sql = "UPDATE pedido SET total = total + 1 WHERE id_producto = $id_producto";
//$sql = "INSERT INTO [V_Venut_2019-12]"
if ($conn->query($valor) === TRUE) {
    echo "Se ha actualizado el total de pedido";
    echo $valor
} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();
echo $producto;
echo " ";
echo $id_producto;
?>
