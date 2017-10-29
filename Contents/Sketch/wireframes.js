function writeTextToFile (filePath, text) {
    const t = [NSString stringWithFormat:@"%@", text]
    const f = [NSString stringWithFormat:@"%@", filePath]
    return [t writeToFile:f atomically:true encoding:NSUTF8StringEncoding error:nil]
}

function chooseFolder () {
  const openPanel = [NSOpenPanel openPanel]

  [openPanel setTitle: "Choose a location…"]
  [openPanel setMessage: "Select the export location…"]
  [openPanel setPrompt: "Export"]

  [openPanel setCanCreateDirectories: true]
  [openPanel setCanChooseFiles: false]
  [openPanel setCanChooseDirectories: true]
  [openPanel setAllowsMultipleSelection: false]
  [openPanel setShowsHiddenFiles: false]
  [openPanel setExtensionHidden: false]

  const openPanelButtonPressed = [openPanel runModal]

  if (openPanelButtonPressed == NSFileHandlingPanelOKButton) {
    return [openPanel URL]
  } else {
    exit()
	}
}

function createFolder (name) {
	var fileManager = [NSFileManager defaultManager]
	[fileManager createDirectoryAtPath:name withIntermediateDirectories:true attributes:nil error:nil]
}

function deleteFile (name) {
	var fileManager = [NSFileManager defaultManager]
	[fileManager removeItemAtPath:name error:nil]
}

function map (array, fn) {
  const result = []

  array.forEach((item, i) => {
    result[i] = fn(item)
  })

  return result
}

function slug (text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

function onExportWireframes (context) {
  const document = context.document
  const exportPath = chooseFolder().path() + '/wireframes'

  deleteFile(exportPath)
  createFolder(exportPath)
  createFolder(`${exportPath}/pages`)

  // const pages = document.pages()

  // pages.forEach(page => {
  //   const artboards = page.artboards()
  //
    // artboards.forEach(artboard => {
    //   const filename = `${exportPath}/assets/${page.name()}/${artboard.name()}.png`
    //   const slice = MSSliceLayer.sliceLayerFromLayer(artboard)
    //   const rect = artboard.absoluteRect()
    //
    //   slice.absoluteRect().setX(rect.origin().x)
    //   slice.absoluteRect().setY(rect.origin().y)
    //   slice.absoluteRect().setWidth(rect.size().width)
    //   slice.absoluteRect().setHeight(rect.size().height)
    //
    //   const options = slice.exportOptions().exportFormats().lastObject()
    //
    //   options.scale = 2
    //   options.format = 'png'
    //
    //   document.saveArtboardOrSlice_toFile(slice, filename)
    //
    //   slice.removeFromParent()
    // })
  // })

  // index.html
  writeTextToFile(`${exportPath}/index.html`, `
    <ul>
      ${map(document.pages(), page => `
        <li>
          <a href="pages/${slug(page.name())}/index.html">
            ${page.name()}
          </a>
        </li>
      `).join('\n')}
    </ul>
  `)

  // pages/[page].html
  document.pages().forEach(page => {
    const folder = `${exportPath}/pages/${slug(page.name())}`
    const indexPath = `${folder}/index.html`

    createFolder(folder)
    writeTextToFile(indexPath, `
      ${map(page.artboards(), artboard => `
        <li>
          <a href="${slug(artboard.name())}/index.html">
            ${artboard.name()}
          </a>
        </li>
      `).join('\n')}
    `)

    page.artboards().forEach(artboard => {
      const boardFolder = `${folder}/${slug(artboard.name())}`
      const boardIndexPath = `${boardFolder}/index.html`
      const boardImageName = 'image.png'
      const boardImagePath = `${boardFolder}/${boardImageName}`

      const slice = MSSliceLayer.sliceLayerFromLayer(artboard)
      const rect = artboard.absoluteRect()

      slice.absoluteRect().setX(rect.origin().x)
      slice.absoluteRect().setY(rect.origin().y)
      slice.absoluteRect().setWidth(rect.size().width)
      slice.absoluteRect().setHeight(rect.size().height)
      slice.exportOptions().exportFormats().lastObject().setScale(4)

      document.saveArtboardOrSlice_toFile(slice, boardImagePath)

      slice.removeFromParent()

      writeTextToFile(boardIndexPath, `
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { margin: 0; }
            img { width: 100%; display: block; }
          </style>
        </head>
        <body>
          <img src="${boardImageName}" />
        </body>
      `)
    })
  })
}
