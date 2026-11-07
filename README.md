# usage-ribbon

A Claude Code mod that shows a ribbon above the prompt with:

- context size (tokens used / window, and percent)
- session cost
- how much of the 5-hour and 7-day usage limits is used, and how long until each resets

It also puts the context size and cost in the status line.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install usage-ribbon --marketplace Fonzo22/usage-ribbon
```

Answer `y` to add the marketplace, then pick a scope (user scope makes it load in every session).

From a shell:

```bash
claude plugin install usage-ribbon --marketplace Fonzo22/usage-ribbon
```

In the Claude desktop app: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `Fonzo22/usage-ribbon`, then **Add plugin**.
