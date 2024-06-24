from PIL import Image
import os

# Directorio de entrada y salida
input_dir = r"C:\Workspace\Proyecto Sharigann\Proyecto-commic-sharingan\assets\img"
output_dir = r"C:\Workspace\Proyecto Sharigann\Proyecto-commic-sharingan\assets\img"

# Tamaño deseado
new_size = (300, 200)  # Ancho x Alto

# Si la carpeta de salida no existe, créala
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Recorre todas las imágenes en el directorio de entrada
for filename in os.listdir(input_dir):
    if filename.endswith(".jpg") or filename.endswith(".png"):
        # Abre la imagen
        with Image.open(os.path.join(input_dir, filename)) as img:
            # Redimensiona la imagen
            resized_img = img.resize(new_size)
            # Guarda la imagen redimensionada en la carpeta de salida
            resized_img.save(os.path.join(output_dir, filename))
            print(f"Imagen {filename} redimensionada y guardada.")