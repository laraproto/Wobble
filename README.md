# Wobble

Silly discord bot with the intention of being incredibly easy to run, drop an executable and run

## Info

This project is loosely based of Zeppelin but instead of it being configured with yaml it has a really really ugly ui to do so, and probably not very optimised, this bot is basically if you took something easy, overcomplicated it for no reason and lost your shit making it

## Can it be used

Sure, there's a lot of stuff missing in terms of functionality, there's no dashboard users and I honestly cba to do that after all the module config pages but functionally it works, a majority of this project was developed using pglite, a postgresql database in a single file, so it should be really easy to run, you just need to bring a [reverse proxy I recommend Caddy](https://caddyserver.com)

## Frontend

The frontend is at best obtuse, session cookies are slightly cooked, and there's definitely some stuff I wish I had gotten around to but given it's the 26th and the deadline for midnight is the 28th I want to ship it for now, having to insert discord snowflakes in some places is annoying but it works but I'm glad I'm done with dealing with react for now

## Info for Midnight Reviewers

This project should be absolutely easy to run, I'll hopefully be providing a demo if I can find where to host it (nest being down is a rhetorical pain in the ass), I'll hopefully ship some release files tho, the project doesn't use fine grained permissions yet (blanket requests administrator to a server), but everything should be easily understood hopefully

Oh and sorry if any files are painful to read, tanstack form is a bit weird and I had to do a lot of back and forth conversion since it doesn't like undefined or nullable values, I definitely could have made it more readable if I had done more component splits so I don't end up with 1200 line files (automod and mod actions frontend) but it's a bit late for that,

## Roadmap

- [x] Command System
- [x] Dashboard (stuff is getting there)
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
