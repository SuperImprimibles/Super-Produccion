Attribute VB_Name = "Paso1"
Sub FORMULARIO()
    Call InsertarFondosYRutas
End Sub

Sub InsertarFondosYRutas()
    Dim RutaCarpeta As String
    Dim RutaFondos As String
    Dim rutaImagen As String
    Dim Diapositiva As Slide
    Dim Forma As Shape
    Dim i As Integer
    Dim fDialog As FileDialog
    Dim NombreCarpeta As String
    Dim miTexto As String
    Dim imagenesFaltantes As String
    Dim hayFaltantes As Boolean
    Dim fso As Object
    
    ' Crear objeto FileSystemObject para verificar archivos
    Set fso = CreateObject("Scripting.FileSystemObject")
    
    ' Crear un objeto FileDialog para seleccionar la carpeta
    Set fDialog = Application.FileDialog(msoFileDialogFolderPicker)
    
    ' Mostrar el cuadro de diálogo para seleccionar la carpeta
    If fDialog.Show = -1 Then
        RutaCarpeta = fDialog.SelectedItems(1)
    Else
        MsgBox "Operación cancelada por el usuario.", vbExclamation, "Error"
        Exit Sub
    End If
    
    ' Verificar si se proporcionó una ruta válida
    If RutaCarpeta = "" Then
        MsgBox "Ruta inválida. La operación se canceló.", vbExclamation, "Error"
        Exit Sub
    End If
    
    ' Extraer el nombre de la carpeta seleccionada
    NombreCarpeta = Mid(RutaCarpeta, InStrRev(RutaCarpeta, "\") + 1)
    
    ' Buscar la subcarpeta "FONDOS"
    RutaFondos = RutaCarpeta & "\FONDOS"
    
    ' Inicializar variables de validación
    imagenesFaltantes = ""
    hayFaltantes = False
    
    ' Verificar imágenes en FONDOS (1-12 para #PAPEL y 1-6 para #FONDO)
    For i = 1 To 12
        rutaImagen = RutaFondos & "\" & i & ".png"
        If Not fso.FileExists(rutaImagen) Then
            imagenesFaltantes = imagenesFaltantes & vbCrLf & "FONDOS\" & i & ".png"
            hayFaltantes = True
        End If
    Next i
    
    ' Verificar imágenes en PNG (1-13)
    For i = 1 To 13
        rutaImagen = RutaCarpeta & "\PNG\" & i & ".png"
        If Not fso.FileExists(rutaImagen) Then
            imagenesFaltantes = imagenesFaltantes & vbCrLf & "PNG\" & i & ".png"
            hayFaltantes = True
        End If
    Next i
    
    ' Si hay imágenes faltantes, mostrar mensaje y salir
    If hayFaltantes Then
        MsgBox "Faltan las siguientes imágenes:" & vbCrLf & imagenesFaltantes, vbExclamation, "Imágenes Faltantes"
        Exit Sub
    End If
    
    ' Número de la diapositiva donde deseas insertar las imágenes
    Set Diapositiva = ActivePresentation.Slides(71)
    
    ' Insertar imágenes en las formas y asignar rutas a las formas #PAPEL
    For i = 1 To 12
        rutaImagen = RutaFondos & "\" & i & ".png"
        Set Forma = Diapositiva.Shapes("#PAPEL" & i)
        Forma.Fill.UserPicture rutaImagen
    Next i
    
    ' Asignar ruta de la imagen al texto de la forma
    For i = 1 To 6
        rutaImagen = RutaFondos & "\" & i & ".png"
        Set Forma = Diapositiva.Shapes("#FONDO" & i)
        Forma.Fill.UserPicture rutaImagen
        Forma.TextFrame.TextRange.Text = rutaImagen
    Next i
    
    ' Insertar imágenes desde la subcarpeta "PNG"
    For i = 1 To 13
        rutaImagen = RutaCarpeta & "\PNG\" & i & ".png"
        Set Forma = Diapositiva.Shapes("#PNG" & i)
        Forma.Fill.UserPicture rutaImagen
    Next i
    
    ' Agregar texto a la forma #TEMATICA con el nombre de la carpeta como sugerencia
    On Error Resume Next
    Set Forma = Diapositiva.Shapes("#TEMATICA")
    On Error GoTo 0
    
    If Not Forma Is Nothing Then
        ' Pregunta al usuario con el nombre de la carpeta como valor predeterminado
        miTexto = InputBox("Nombre del kit", "TEMATICA", NombreCarpeta)
        
        ' Si el usuario no canceló, agrega el texto a la forma
        If miTexto <> "" Then
            Forma.TextFrame.TextRange.Text = miTexto
        End If
    Else
        MsgBox "La forma '#TEMATICA' no se encontró en la diapositiva 71."
    End If
    
End Sub
