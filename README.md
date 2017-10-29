# Wireframes.sketchplugin
Sketch plugin for generating linkable html files from pages/artboards

## Install on Mac
```
$ cd ~/Library/Application Support/com.bohemiancoding.sketch3/Plugins
$ git clone git@github.com:internetfriendsforever/Wireframes.sketchplugin.git
```

## Usage
In Sketch:

- Create pages to group screens as different flows (i.e. signup, send email, delete account, etc.)
- Create artboards within pages to create different screens (i.e. login, list, detail, error, etc.)
- Create links from layers within a flow by naming it `->[artboard name]` (i.e. `->login`)
- Name an artboard `index` as this will be the entry of this flow
- Export from menu bar: Plugins -> Wireframes -> Export wireframes (⌘⇧w)

## TODO
- ~~Make links work~~
