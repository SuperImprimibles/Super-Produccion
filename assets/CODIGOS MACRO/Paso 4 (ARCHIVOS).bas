Attribute VB_Name = "Paso4"
Sub PORTADAS()
    Call RecopilarFuentesUnicas
    Call CrearCarpetaEnEscritorio2
    Call GuardarAgrupacionComoImagenConNombre2
    Call GuardarAgrupacionComoImagenConNombre3
    Call GuardarAgrupacionComoImagenConNombre4
    Call GuardarAgrupacionComoImagenConNombre5
    Call GuardarAgrupacionComoImagenConNombre6
    Call GuardarAgrupacionComoImagenConNombre7
    Call GuardarAgrupacionComoImagenConNombre8
    Call GuardarAgrupacionComoImagenConNombre9
    Call GuardarAgrupacionComoImagenConNombre10
    
    
    Call RecopilarFuentes
    
    Call EliminarSecciones1
    Call GuardarEnCarpetaKit
    Call EliminarSecciones2
    Call EliminarSecciones3
    Call GuardarCambios
End Sub
Sub RecopilarFuentesUnicas()
    Dim objSlide As slide
    Dim objShape As Shape
    Dim dictFuentes As Object
    Dim objFSO As Object
    Dim objFile As Object
    Dim strRutaArchivo As String

    ' Ruta donde se guardará el archivo
    strRutaArchivo = "C:\Users\Cristian\Desktop\FuentesUtilizadas.txt"

    ' Crea un diccionario para almacenar fuentes únicas
    Set dictFuentes = CreateObject("Scripting.Dictionary")

    ' Recorre todas las diapositivas
    For Each objSlide In ActivePresentation.Slides
        For Each objShape In objSlide.Shapes
            If objShape.HasTextFrame Then
                ' Verifica si el objeto tiene texto
                If objShape.TextFrame.HasText Then
                    ' Agrega la fuente al diccionario (sin duplicados)
                    dictFuentes(objShape.TextFrame.TextRange.Font.Name) = 1
                End If
            End If
            ' Si el objeto es un grupo de formas
            If objShape.Type = msoGroup Then
                Dim subShape As Shape
                For Each subShape In objShape.GroupItems
                    If subShape.HasTextFrame Then
                        If subShape.TextFrame.HasText Then
                            dictFuentes(subShape.TextFrame.TextRange.Font.Name) = 1
                        End If
                    End If
                Next subShape
            End If
        Next objShape
    Next objSlide

    ' Crea un archivo de texto para guardar las fuentes únicas
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    Set objFile = objFSO.CreateTextFile(strRutaArchivo, True)
    objFile.Write Join(dictFuentes.Keys, vbCrLf)
    objFile.Close
End Sub
Sub RecopilarFuentesUnicas1()
    Dim oSlide As slide
    Dim oShape As Shape
    Dim sFuentes As String
    Dim oListadoFuentes As Shape
    Dim dictFuentes As Object
    Set dictFuentes = CreateObject("Scripting.Dictionary")

    ' Recorre las diapositivas del 1 al 70
    For i = 1 To 70
        Set oSlide = ActivePresentation.Slides(i)
        ' Recorre todas las formas en la diapositiva actual
        For Each oShape In oSlide.Shapes
            If oShape.HasTextFrame Then
                ' Verifica si la forma tiene texto
                If oShape.TextFrame.HasText Then
                    ' Agrega la fuente al diccionario (sin duplicados)
                    dictFuentes(oShape.TextFrame.TextRange.Font.Name) = 1
                End If
            End If
        Next oShape
    Next i

    ' Crea una cadena de fuentes únicas
    sFuentes = Join(dictFuentes.Keys, vbCrLf)

    ' Busca la forma "LISTADO DE FUENTES" (ajusta el nombre según tu presentación)
    On Error Resume Next
    Set oListadoFuentes = ActivePresentation.Slides(71).Shapes("LISTADO DE FUENTES")
    On Error GoTo 0

    ' Escribe las fuentes en la forma "LISTADO DE FUENTES"
    If Not oListadoFuentes Is Nothing Then
        oListadoFuentes.TextFrame.TextRange.Text = sFuentes
    Else
        MsgBox "No se encontró la forma 'LISTADO DE FUENTES'. Asegúrate de que exista en la primera diapositiva.", vbExclamation, "Error"
    End If
End Sub
Sub CrearCarpetaEnEscritorio2()
    Dim CarpetaNombre As String
    Dim CarpetaRuta As String
    Dim CarpetaForma As Shape
    
    ' Obtén el texto de la diapositiva 71 (ajusta el índice según corresponda)
    CarpetaNombre = ActivePresentation.Slides(71).Shapes("#TEMATICA").TextFrame.TextRange.Text
    
    ' Agrega " - PORTADAS" al nombre de la carpeta
    CarpetaNombre = CarpetaNombre & " - PORTADAS"
    
    ' Ruta de la carpeta en el escritorio
    CarpetaRuta = Environ("USERPROFILE") & "\Desktop\" & CarpetaNombre
    
    ' Crea la carpeta si no existe
    If Dir(CarpetaRuta, vbDirectory) = "" Then
        MkDir CarpetaRuta
    Else
        MsgBox "La carpeta '" & CarpetaNombre & "' ya existe en el escritorio.", vbExclamation, "Carpeta existente"
    End If
    
    ' Actualiza el texto en la forma "CARPETA PORTADAS"
    On Error Resume Next
    Set CarpetaForma = ActivePresentation.Slides(71).Shapes("CARPETA PORTADAS")
    If Not CarpetaForma Is Nothing Then
        CarpetaForma.TextFrame.TextRange.Text = CarpetaRuta
    End If
End Sub
Sub GuardarAgrupacionComoImagenConNombre2()
    Dim Grupo As Shape
    Dim Ruta As String
    Dim NombreImagen As String
    Dim Diapositiva As slide
    
    ' Cambia "NombreDelGrupo" al nombre de tu agrupación en la diapositiva 80
    Set Grupo = ActivePresentation.Slides(73).Shapes("1")
    
    ' Define el nombre de la imagen
    NombreImagen = "1"
    
    ' Obtén la ruta desde la forma "CARPETA KIT" en la diapositiva 71
    Set Diapositiva = ActivePresentation.Slides(71)
    Ruta = Diapositiva.Shapes("CARPETA PORTADAS").TextFrame.TextRange.Text
    
    ' Verifica si la carpeta existe; si no, créala
    If Dir(Ruta, vbDirectory) = "" Then
        MkDir Ruta
    End If
    
    ' Ruta completa para guardar la imagen
    RutaCompleta = Ruta & "\" & NombreImagen & ".png"
    
    ' Guarda la agrupación como imagen en la ubicación deseada
    Grupo.Export RutaCompleta, ppShapeFormatPNG
End Sub
Sub GuardarAgrupacionComoImagenConNombre3()
    Dim Grupo As Shape
    Dim Ruta As String
    Dim NombreImagen As String
    Dim Diapositiva As slide
    
    ' Cambia "NombreDelGrupo" al nombre de tu agrupación en la diapositiva 80
    Set Grupo = ActivePresentation.Slides(74).Shapes("2")
    
    ' Define el nombre de la imagen
    NombreImagen = "2"
    
    ' Obtén la ruta desde la forma "CARPETA KIT" en la diapositiva 71
    Set Diapositiva = ActivePresentation.Slides(71)
    Ruta = Diapositiva.Shapes("CARPETA PORTADAS").TextFrame.TextRange.Text
    
    ' Verifica si la carpeta existe; si no, créala
    If Dir(Ruta, vbDirectory) = "" Then
        MkDir Ruta
    End If
    
    ' Ruta completa para guardar la imagen
    RutaCompleta = Ruta & "\" & NombreImagen & ".png"
    
    ' Guarda la agrupación como imagen en la ubicación deseada
    Grupo.Export RutaCompleta, ppShapeFormatPNG
End Sub
Sub GuardarAgrupacionComoImagenConNombre4()
    Dim Grupo As Shape
    Dim Ruta As String
    Dim NombreImagen As String
    Dim Diapositiva As slide
    
    ' Cambia "NombreDelGrupo" al nombre de tu agrupación en la diapositiva 80
    Set Grupo = ActivePresentation.Slides(75).Shapes("3")
    
    ' Define el nombre de la imagen
    NombreImagen = "3"
    
    ' Obtén la ruta desde la forma "CARPETA KIT" en la diapositiva 71
    Set Diapositiva = ActivePresentation.Slides(71)
    Ruta = Diapositiva.Shapes("CARPETA PORTADAS").TextFrame.TextRange.Text
    
    ' Verifica si la carpeta existe; si no, créala
    If Dir(Ruta, vbDirectory) = "" Then
        MkDir Ruta
    End If
    
    ' Ruta completa para guardar la imagen
    RutaCompleta = Ruta & "\" & NombreImagen & ".png"
    
    ' Guarda la agrupación como imagen en la ubicación deseada
    Grupo.Export RutaCompleta, ppShapeFormatPNG
End Sub
Sub GuardarAgrupacionComoImagenConNombre5()
    Dim Grupo As Shape
    Dim Ruta As String
    Dim NombreImagen As String
    Dim Diapositiva As slide
    
    ' Cambia "NombreDelGrupo" al nombre de tu agrupación en la diapositiva 80
    Set Grupo = ActivePresentation.Slides(76).Shapes("4")
    
    ' Define el nombre de la imagen
    NombreImagen = "4"
    
    ' Obtén la ruta desde la forma "CARPETA KIT" en la diapositiva 71
    Set Diapositiva = ActivePresentation.Slides(71)
    Ruta = Diapositiva.Shapes("CARPETA PORTADAS").TextFrame.TextRange.Text
    
    ' Verifica si la carpeta existe; si no, créala
    If Dir(Ruta, vbDirectory) = "" Then
        MkDir Ruta
    End If
    
    ' Ruta completa para guardar la imagen
    RutaCompleta = Ruta & "\" & NombreImagen & ".png"
    
    ' Guarda la agrupación como imagen en la ubicación deseada
    Grupo.Export RutaCompleta, ppShapeFormatPNG
End Sub
Sub GuardarAgrupacionComoImagenConNombre6()
    Dim Grupo As Shape
    Dim Ruta As String
    Dim NombreImagen As String
    Dim Diapositiva As slide
    
    ' Cambia "NombreDelGrupo" al nombre de tu agrupación en la diapositiva 80
    Set Grupo = ActivePresentation.Slides(77).Shapes("5")
    
    ' Define el nombre de la imagen
    NombreImagen = "5"
    
    ' Obtén la ruta desde la forma "CARPETA KIT" en la diapositiva 71
    Set Diapositiva = ActivePresentation.Slides(71)
    Ruta = Diapositiva.Shapes("CARPETA PORTADAS").TextFrame.TextRange.Text
    
    ' Verifica si la carpeta existe; si no, créala
    If Dir(Ruta, vbDirectory) = "" Then
        MkDir Ruta
    End If
    
    ' Ruta completa para guardar la imagen
    RutaCompleta = Ruta & "\" & NombreImagen & ".png"
    
    ' Guarda la agrupación como imagen en la ubicación deseada
    Grupo.Export RutaCompleta, ppShapeFormatPNG
End Sub
Sub GuardarAgrupacionComoImagenConNombre7()
    Dim Grupo As Shape
    Dim Ruta As String
    Dim NombreImagen As String
    Dim Diapositiva As slide
    
    ' Cambia "NombreDelGrupo" al nombre de tu agrupación en la diapositiva 80
    Set Grupo = ActivePresentation.Slides(78).Shapes("6")
    
    ' Define el nombre de la imagen
    NombreImagen = "6"
    
    ' Obtén la ruta desde la forma "CARPETA KIT" en la diapositiva 71
    Set Diapositiva = ActivePresentation.Slides(71)
    Ruta = Diapositiva.Shapes("CARPETA PORTADAS").TextFrame.TextRange.Text
    
    ' Verifica si la carpeta existe; si no, créala
    If Dir(Ruta, vbDirectory) = "" Then
        MkDir Ruta
    End If
    
    ' Ruta completa para guardar la imagen
    RutaCompleta = Ruta & "\" & NombreImagen & ".png"
    
    ' Guarda la agrupación como imagen en la ubicación deseada
    Grupo.Export RutaCompleta, ppShapeFormatPNG
End Sub
Sub GuardarAgrupacionComoImagenConNombre8()
    Dim Grupo As Shape
    Dim Ruta As String
    Dim NombreImagen As String
    Dim Diapositiva As slide
    
    ' Cambia "NombreDelGrupo" al nombre de tu agrupación en la diapositiva 80
    Set Grupo = ActivePresentation.Slides(79).Shapes("7")
    
    ' Define el nombre de la imagen
    NombreImagen = "7"
    
    ' Obtén la ruta desde la forma "CARPETA KIT" en la diapositiva 71
    Set Diapositiva = ActivePresentation.Slides(71)
    Ruta = Diapositiva.Shapes("CARPETA PORTADAS").TextFrame.TextRange.Text
    
    ' Verifica si la carpeta existe; si no, créala
    If Dir(Ruta, vbDirectory) = "" Then
        MkDir Ruta
    End If
    
    ' Ruta completa para guardar la imagen
    RutaCompleta = Ruta & "\" & NombreImagen & ".png"
    
    ' Guarda la agrupación como imagen en la ubicación deseada
    Grupo.Export RutaCompleta, ppShapeFormatPNG
End Sub
Sub GuardarAgrupacionComoImagenConNombre9()
    Dim Grupo As Shape
    Dim Ruta As String
    Dim NombreImagen As String
    Dim Diapositiva As slide
    
    ' Cambia "NombreDelGrupo" al nombre de tu agrupación en la diapositiva 80
    Set Grupo = ActivePresentation.Slides(80).Shapes("8")
    
    ' Define el nombre de la imagen
    NombreImagen = "8"
    
    ' Obtén la ruta desde la forma "CARPETA KIT" en la diapositiva 71
    Set Diapositiva = ActivePresentation.Slides(71)
    Ruta = Diapositiva.Shapes("CARPETA PORTADAS").TextFrame.TextRange.Text
    
    ' Verifica si la carpeta existe; si no, créala
    If Dir(Ruta, vbDirectory) = "" Then
        MkDir Ruta
    End If
    
    ' Ruta completa para guardar la imagen
    RutaCompleta = Ruta & "\" & NombreImagen & ".png"
    
    ' Guarda la agrupación como imagen en la ubicación deseada
    Grupo.Export RutaCompleta, ppShapeFormatPNG
End Sub
Sub GuardarAgrupacionComoImagenConNombre10()
    Dim Grupo As Shape
    Dim Ruta As String
    Dim NombreImagen As String
    Dim Diapositiva As slide
    
    ' Cambia "NombreDelGrupo" al nombre de tu agrupación en la diapositiva 80
    Set Grupo = ActivePresentation.Slides(81).Shapes("9")
    
    ' Define el nombre de la imagen
    NombreImagen = "9"
    
    ' Obtén la ruta desde la forma "CARPETA KIT" en la diapositiva 71
    Set Diapositiva = ActivePresentation.Slides(71)
    Ruta = Diapositiva.Shapes("CARPETA PORTADAS").TextFrame.TextRange.Text
    
    ' Verifica si la carpeta existe; si no, créala
    If Dir(Ruta, vbDirectory) = "" Then
        MkDir Ruta
    End If
    
    ' Ruta completa para guardar la imagen
    RutaCompleta = Ruta & "\" & NombreImagen & ".png"
    
    ' Guarda la agrupación como imagen en la ubicación deseada
    Grupo.Export RutaCompleta, ppShapeFormatPNG
End Sub
Sub GuardarEnCarpetaKit()
    Dim CarpetaKit As String
    Dim RutaCompleta As String
    Dim Forma As Shape
    Dim NombrePresentacion As String
    
    ' Nombre de la forma que contiene la ruta
    Set Forma = ActivePresentation.Slides(71).Shapes("CARPETA KIT")
    
    ' Obtener la ruta del texto dentro de la forma
    CarpetaKit = Forma.TextFrame.TextRange.Text
    
    ' Obtener el nombre de la presentación (texto en la forma "#TEMATICA")
    NombrePresentacion = ActivePresentation.Slides(71).Shapes("#TEMATICA").TextFrame.TextRange.Text
    
    ' Agregar el texto al nombre de la presentación
    NombrePresentacion = NombrePresentacion & " - Kit Imprimible Editable"
    
    ' Ruta completa para guardar la presentación
    RutaCompleta = CarpetaKit & "\" & NombrePresentacion & ".pptx"
    
    ' Guardar la presentación
    ActivePresentation.SaveAs RutaCompleta
End Sub
Sub GuardarCambios()
    ' Guarda la presentación activa si ha sido modificada desde la última vez que se guardó
    With Application.ActivePresentation
        If Not .Saved And .Path <> "" Then
            .Save
        End If
    End With
End Sub
Sub ExtraerTextoYGuardarEnArchivo()
    Dim oSlide As slide
    Dim oShape As Shape
    Dim oTextRange As TextRange
    Dim sTexto As String
    Dim oFSO As Object
    Dim oFile As Object
    Dim sRutaArchivo As String
    
    ' Diapositiva y nombres de las formas
    Dim iNumDiapositiva As Integer
    Dim sNombreFormaTexto As String
    Dim sNombreFormaRuta As String
    
    iNumDiapositiva = 71
    sNombreFormaTexto = "LISTADO DE FUENTES"
    sNombreFormaRuta = "CARPETA PORTADAS"
    
    ' Ruta donde deseas guardar el archivo de texto
    sRutaArchivo = ActivePresentation.Slides(iNumDiapositiva).Shapes(sNombreFormaRuta).TextFrame.TextRange.Text
    
    ' Busca la forma de texto y extrae su contenido
    For Each oShape In ActivePresentation.Slides(iNumDiapositiva).Shapes
        If oShape.Name = sNombreFormaTexto And oShape.HasTextFrame Then
            Set oTextRange = oShape.TextFrame.TextRange
            sTexto = oTextRange.Text
            Exit For
        End If
    Next oShape
    
    ' Crea el archivo de texto y escribe el contenido
    Set oFSO = CreateObject("Scripting.FileSystemObject")
    Set oFile = oFSO.CreateTextFile(sRutaArchivo & "\FUENTES.txt", True)
    oFile.Write sTexto
    oFile.Close
    
End Sub
Sub EliminarSecciones1()
    Dim oPres As Presentation
    Dim oSec As SectionProperties
    Dim i As Long

    ' Referencia a la presentación actual
    Set oPres = ActivePresentation

    ' Referencia a las secciones de la presentación
    Set oSec = oPres.SectionProperties

    ' Recorre todas las secciones en orden inverso
    For i = oSec.Count To 1 Step -1
        ' Si el nombre de la sección es "INSTRUCTIVO" o "PORTADA", entonces elimina la sección
        If oSec.Name(i) = "INSTRUCTIVO" Or oSec.Name(i) = "PORTADA" Then
            oSec.Delete i, DeleteSlides:=True
        End If
    Next i
End Sub
Sub EliminarSecciones2()
    Dim oPres As Presentation
    Dim oSec As SectionProperties
    Dim i As Long

    ' Referencia a la presentación actual
    Set oPres = ActivePresentation

    ' Referencia a las secciones de la presentación
    Set oSec = oPres.SectionProperties

    ' Recorre todas las secciones en orden inverso
    For i = oSec.Count To 1 Step -1
        ' Si el nombre de la sección es "FORMULARIO", entonces elimina la sección
        If oSec.Name(i) = "FORMULARIO" Then
            oSec.Delete i, DeleteSlides:=True
        End If
    Next i
End Sub
Sub EliminarSecciones3()
    Dim oPres As Presentation
    Dim oSec As SectionProperties
    Dim i As Long

    ' Referencia a la presentación actual
    Set oPres = ActivePresentation

    ' Referencia a las secciones de la presentación
    Set oSec = oPres.SectionProperties

    ' Recorre todas las secciones en orden inverso
    For i = oSec.Count To 1 Step -1
        ' Si el nombre de la sección es "FORMULARIO", entonces elimina la sección
        If oSec.Name(i) = "POSTERS HORIZONTAL" Then
            oSec.Delete i, DeleteSlides:=True
        End If
    Next i
End Sub
Sub RecopilarFuentes()
    Dim objSlide As slide
    Dim objShape As Shape
    Dim dictFuentes As Object
    Dim objFSO As Object
    Dim objFile As Object
    Dim strRutaArchivo As String

    ' Ruta donde se guardará el archivo
    strRutaArchivo = ActivePresentation.Slides(71).Shapes("CARPETA PORTADAS").TextFrame.TextRange.Text & "\FUENTES.txt"

    ' Crea un diccionario para almacenar fuentes únicas
    Set dictFuentes = CreateObject("Scripting.Dictionary")

    ' Recorre todas las diapositivas
    For Each objSlide In ActivePresentation.Slides
        For Each objShape In objSlide.Shapes
            If objShape.HasTextFrame Then
                ' Verifica si el objeto tiene texto
                If objShape.TextFrame.HasText Then
                    ' Agrega la fuente al diccionario (sin duplicados)
                    dictFuentes(objShape.TextFrame.TextRange.Font.Name) = 1
                End If
            End If
            ' Si el objeto es un grupo de formas
            If objShape.Type = msoGroup Then
                Dim subShape As Shape
                For Each subShape In objShape.GroupItems
                    If subShape.HasTextFrame Then
                        If subShape.TextFrame.HasText Then
                            dictFuentes(subShape.TextFrame.TextRange.Font.Name) = 1
                        End If
                    End If
                Next subShape
            End If
        Next objShape
    Next objSlide

    ' Crea un archivo de texto para guardar las fuentes únicas
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    Set objFile = objFSO.CreateTextFile(strRutaArchivo, True)
    objFile.Write Join(dictFuentes.Keys, vbCrLf)
    objFile.Close

End Sub
Sub RecopilarFuentes1()
    Dim objSlide As slide
    Dim objShape As Shape
    Dim dictFuentes As Object
    Dim objFSO As Object
    Dim objFile As Object
    Dim strRutaArchivo As String
    Dim fuentesExcluidas As Variant
    Dim fuente As String

    ' Lista de fuentes a excluir
    fuentesExcluidas = Array("Calibri", "Sports Bar", "Arial", "Arial Black", "KG LET HER GO OUTLINE", _
                             "Carton Six", "Aachen Medium", "Amatic", "-apple-system", "Cartoon Slam", _
                             "Amatic SC", "Comic Sans MS", "Aptos Black")

    ' Ruta donde se guardará el archivo
    strRutaArchivo = ActivePresentation.Slides(71).Shapes("CARPETA PORTADAS").TextFrame.TextRange.Text & "\FUENTES.txt"

    ' Crea un diccionario para almacenar fuentes únicas
    Set dictFuentes = CreateObject("Scripting.Dictionary")

    ' Recorre todas las diapositivas
    For Each objSlide In ActivePresentation.Slides
        For Each objShape In objSlide.Shapes
            If objShape.HasTextFrame Then
                ' Verifica si el objeto tiene texto
                If objShape.TextFrame.HasText Then
                    fuente = objShape.TextFrame.TextRange.Font.Name
                    ' Agrega la fuente al diccionario si no está en la lista de excluidas
                    If IsError(Application.Match(fuente, fuentesExcluidas, 0)) Then
                        dictFuentes(fuente) = 1
                    End If
                End If
            End If
            ' Si el objeto es un grupo de formas
            If objShape.Type = msoGroup Then
                Dim subShape As Shape
                For Each subShape In objShape.GroupItems
                    If subShape.HasTextFrame Then
                        If subShape.TextFrame.HasText Then
                            fuente = subShape.TextFrame.TextRange.Font.Name
                            ' Agrega la fuente al diccionario si no está en la lista de excluidas
                            If IsError(Application.Match(fuente, fuentesExcluidas, 0)) Then
                                dictFuentes(fuente) = 1
                            End If
                        End If
                    End If
                Next subShape
            End If
        Next objShape
    Next objSlide

    ' Crea un archivo de texto para guardar las fuentes únicas
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    Set objFile = objFSO.CreateTextFile(strRutaArchivo, True)
    objFile.Write Join(dictFuentes.Keys, vbCrLf)
    objFile.Close
End Sub

