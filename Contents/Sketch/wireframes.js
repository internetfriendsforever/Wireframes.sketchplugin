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

  array.forEach(item => {
    result.push(fn(item))
  })

  return result
}

function filter (array, fn) {
  const result = []

  array.forEach(item => {
    if (fn(item)) {
      result.push(item)
    }
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

function findLayersUsingPredicate (predicate, object, container) {
  const scope = container.children()
	const	layerPredicate = NSPredicate.predicateWithFormat(predicate, object, container)
	return [scope filteredArrayUsingPredicate:layerPredicate]
}

function getLinkLayers (container) {
  return findLayersUsingPredicate('name BEGINSWITH %@', '->', container)
}

function onExportWireframes (context) {
  const document = context.document
  const exportPath = chooseFolder().path() + '/wireframes'

  deleteFile(exportPath)
  createFolder(exportPath)

  // index.html
  writeTextToFile(`${exportPath}/index.html`, `
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      <h1>Pages</h1>
      <ul>
        ${map(document.pages().reverse(), page => `
          <li>
            <a href="${slug(page.name())}/index.html">
              ${page.name()}
            </a>
          </li>
        `).join('\n')}
      </ul>
    </body>
  `)

  // [page]/index.html
  document.pages().forEach(page => {
    const folder = `${exportPath}/${slug(page.name())}`

    createFolder(folder)

    page.artboards().forEach(artboard => {
      const boardIndexPath = `${folder}/${slug(artboard.name())}.html`
      const boardImageName = `${slug(artboard.name())}.png`
      const boardImagePath = `${folder}/${boardImageName}`

      const slice = MSSliceLayer.sliceLayerFromLayer(artboard)
      const rect = artboard.absoluteRect()

      slice.absoluteRect().setX(rect.origin().x)
      slice.absoluteRect().setY(rect.origin().y)
      slice.absoluteRect().setWidth(rect.size().width)
      slice.absoluteRect().setHeight(rect.size().height)
      slice.exportOptions().exportFormats().lastObject().setScale(2)

      document.saveArtboardOrSlice_toFile(slice, boardImagePath)

      slice.removeFromParent()

      const scope = artboard.children()
      const layerPredicate = NSPredicate.predicateWithFormat('name BEGINSWITH %@', '->')
      const linkLayers = [scope filteredArrayUsingPredicate:layerPredicate]

      writeTextToFile(boardIndexPath, `
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { margin: 0; }
            img { width: 100%; display: block; }
            a { position: absolute; background: rgba(0, 255, 255, 0.1); outline: 2px rgba(0, 255, 255, 1) solid; }
            .container { position: relative; }
          </style>
        </head>
        <body>
          <div class="container">
            ${map(linkLayers, layer => {
              const stripped = layer.name().replace('->', '')
              const layerRect = layer.rect()
              const left = (layerRect.origin.x / rect.size().width) * 100 + '%'
              const top = (layerRect.origin.y / rect.size().height) * 100 + '%'
              const width = (layerRect.size.width / rect.size().width) * 100 + '%'
              const height = (layerRect.size.height / rect.size().height) * 100 + '%'
              const style = `left: ${left}; top: ${top}; width: ${width}; height: ${height};`
              return `<a href="${slug(stripped)}.html" style="${style}"></a>`
            }).join('\n')}

            <img src="${boardImageName}" />
          </div>
          <script>
            document.addEventListener('touchstart', e => {
              if (e.touches.length >= 3) {
                window.location.href = '../'
              }
            })
          </script>
        </body>
      `)
    })
  })
}
