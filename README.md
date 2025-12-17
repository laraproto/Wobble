# Wobble

Silly discord bot with the intention of being incredibly easy to run, drop an executable and run

## Info

A lot of stuff is loosely based of [Zeppelin](https://zeppelin.gg) including the schema, initially this was a more specific project before I turned it into wobble, main reasoning was to make a Zeppelin alternative that was more user friendly but still capable.

## Roadmap

- [ ] Command System
- [ ] Dashboard (stuff is getting there)
- [ ] Permissions system

## Contributing

This project is really, really easy to get started working on, you literally only need the [Bun Runtime and Package Manager](https://bun.com) installed. Then install deps and run the project

```bash
cd website
bun run dev
```

Main problem, the bot's code doesn't auto reload, I need to add my own file watcher for that and I haven't gotten around to it, to reload the bot you have to modify one of the backend files and the entire project will get reloaded **(frontend stuff will not work as it uses a different HMR system!!!)**

## Building

To build the project you need `zip` in the path, I didn't bother using a zipping package as I intended this to be built automatically, you can get zip via msys2 (or git bash) or chocolatey on windows, or just make the zip archive manually, it won't bother zipping if it can't find the zip program.

```bash
cd website
bun run build
```

then you will find a final exectuable in the `dist` folder.
