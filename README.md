# iq-wide-web

A solana-native take on the World Wide Web.

Where WWW threaded information together through a network of HTTP servers, iq-wide-web threads transactions on the solana chain. Same urges (point at resources with identifiers, give them names humans can remember, link resources to each other, discover and search, let anyone host) re-implemented on a different medium.

A human-facing entry point: throw any identifier at it — wallet, PDA, transaction signature, `.sol` domain — and it figures out what that thing is and renders the right screen.

The difference from WWW is data permanence: the content lives on-chain, so the hosting (the gateway) can vanish and the content stays. The gateway is just a cache — anyone can spin a new one up.

> **Current status: planning.** No code yet. Below is a write-up of what's being built.

## What it is

`gateway.iqlabs.dev` currently does two things in one place:

1. JSON / raw bytes responses — for machines (SDKs, bots, dApps)
2. HTML / images / site serving — for humans (browser visits)

`iq-wide-web` is the human-facing half pulled out into its own service. The gateway is the data API; iq-wide-web takes that data and renders the pages. Put another way, iq-wide-web is the layer that figures out *which* gateway calls to make and stitches the results into a screen.

The existing `iqprofile.net` rolls into this service as one of its views (the wallet profile).

## What it solves

Today, when someone visits an SNS domain (`zo.sol`), the gateway 302s them and the address bar flips to `gateway.iqlabs.dev/...`. From the perspective of someone who bought that `.sol`, their domain identity just disappeared.

With iq-wide-web in front, the content is served under the same host — the address bar stays on `browser.iqlabs.dev/zo.sol`.

The other piece: identifier dispatch. Given just an identifier, iq-wide-web classifies it and shows the right thing. A user doesn't need to know whether a PDA is a git repo, a session, or something else.

### Concrete example — two scenarios for an SNS domain owner

Say someone owns `zo.sol` and wants to set up a page. There are two distinct intents. Compare the gateway-only world with the iq-wide-web world for each.

**Scenario A — personal profile page (wallet)**

A page that represents the wallet as an identity: UserInventory metadata (name / bio / picture), recent assets, posts.

Gateway only:
- There's no defined pattern for an SNS record to point at a wallet (`/site/{sig}/{file}` is a site pattern)
- People end up hand-linking to something like `iqprofile.net/{wallet}` externally
- "Profile page" never becomes a first-class thing tied to the SNS

iq-wide-web:
- SNS record holds just the wallet address
- A visitor hits `zo.sol` → iq-wide-web recognizes it as a wallet → renders the profile
- Address bar stays on `zo.sol.site`

**Scenario B — git-backed site (a page driven by commits)**

A site whose source is the owner's latest git commit, registered on iqpages.

Gateway only:
- SNS record holds `https://gateway.iqlabs.dev/site/{sig}/{file}`
- That record doesn't automatically update when a new commit lands — **it's a snapshot pinned to one sig**
- To reflect a new commit on the SNS, the owner has to rewrite the record by hand with the new sig
- If they wanted "auto-track latest commit" from the start, there's no mechanism for it
- Versioning feels off — the SNS is tied to one frozen commit

iq-wide-web:
- SNS record holds the commit-table PDA (the parent of all commits)
- A visitor hits `zo.sol` → iq-wide-web recognizes the PDA → verifies iqpages registration → serves the entry of the latest commit
- A new push shows up on the next visit — no SNS record edit
- Address bar stays on `zo.sol.site`

Both scenarios share the same value: **the SNS domain works as a stable identity**. The content behind it can change, but the domain itself stays put.

### Why not build this inside the gateway

The original plan was to just bolt this onto the gateway. The reason we stopped is simple:

> **Mixing API code and frontend page code in one service makes it impossible to tell what's what.**

This isn't a taste call, it's a widely-validated split from web2. Look at any normal stack and you'll find two containers / two services:

- **Backend container** — `api.example.com` and similar. Express / FastAPI / Spring, JSON responses. Called by machines (mobile apps, other services, JS clients)
- **Frontend container** — `www.example.com` or `app.example.com`. Next.js / Nuxt / Vite, serving HTML / CSS / JS / images. People hit it from a browser

Why split? Because the two codebases have different **change cadence, build tooling, scaling patterns, caching policy, dependency graphs, and deploy frequency**. Bundle them and you end up rebuilding the frontend to fix one API line, or redeploying the API container because the frontend got a new color. Most teams figured this out a long time ago — *"backend service + frontend app"* is standard.

Same path here. The gateway is the backend data service; iq-wide-web is the frontend web app. Concretely, friction when they live together:

- The file tree turns into a *"is this an API handler or a screen component?"* puzzle on every change
- Routing collides. The gateway's URLs are API paths (`/table/...`, `/data/...`); the human URLs are page paths (`/{wallet}`, `/{repo}.sol`). On the same host you have to decide *"is this path an API call or a page?"* per request. When patterns overlap, an HTML page can leak into a machine response or vice versa

On top of that, what iq-wide-web actually wants to be isn't *"classify an identifier and show it"* — it's **a web that weaves dApp data together for exploration** (mind maps, search, profile↔repo↔transaction links). That's a different shape from a read-only HTTP cache.

So the gateway stays a data service, and iq-wide-web is the human web on top.

## Identifier kinds

`browser.iqlabs.dev/{ident}` — `{ident}` is one of:

- **`.sol` domain** — resolved via SNS, then dispatched on the result
- **pubkey (32–44 base58)** — wallet or PDA
- **tx signature (87–88 base58)** — a single transaction

The first dispatch is shape-based (no RPC). If needed, one gateway call resolves the PDA kind (wallet / Table / UserInventory / Session / etc.) and picks the matching view based on each downstream service's own repo.

## Hosts

| Host | Role |
|---|---|
| `browser.iqlabs.dev` | Main entry point |
| `profile.iqlabs.dev` | Legacy support — keeps old `iqprofile.net` URLs working. Same service, same screen |

Not separate apps. One deployment answers on both hosts.

## What gets rendered

By identifier kind:

- **Wallet** — profile page (name, bio, recent assets / posts)
- **Git repo PDA registered on iqpages** — entry page of the latest commit (the static site)
- **Git repo PDA not registered** — commit history, file tree, "register on iqpages" prompt
- **Session PDA** — bundled-chunk viewer and download
- **Transaction signature** — asset preview (image / text / file) + download + metadata
- **Anything else** — JSON view or 404

## Data sources

All on-chain data goes through `gateway.iqlabs.dev`. No direct RPC from this service — the gateway already does the caching and incremental refresh.

## New ideas — may or may not happen; the whole doc is a draft, this part is more draft

### 1. Mind map (Nubs's idea)

Nubs is adding an endpoint on `gateway.iqlabs.dev` that returns every DbRoot in one call. Each DbRoot carries its dApp's table seeds (hints), and the hint structure itself encodes meaning per dApp (iqchan: board → thread → reply, git: repo → commits, iqpages: deployed).

Pull all the hint trees and the **entire structure of every dApp on IQ** comes into view. iq-wide-web can visualize that like Obsidian — nodes are DbRoot / Table / Row, edges are the parent-child relationships encoded in the hints (e.g. which thread a reply belongs to).

If the value of the web was *"hyperlinks tie pages together,"* the value of IQ is *"on-chain data ties itself together through hint structure."* Make the weave visible and the information network itself becomes browsable.

### 2. Keyword search (Google-style)

If the mind map is *"survey the whole structure,"* search is *"jump in at a keyword."* Type a keyword and get a ranked list of matching inscriptions across all of IQ — like a search results page.

Inspiration:

![reference](./img.png)
https://github.com/IQCoreTeam/iq-cache-mindmap
How it could work:
- Crawl every row via the DbRoot tree (same data source as the mind map)
- Pull text columns (sub, com, name — varies per dApp) into a search index (SQLite FTS5 or Postgres)
- iq-wide-web's `/search?q=...` queries the index
- Each result clicks through to the matching identifier's page (the existing wallet / PDA / sig dispatch handles the rest)

Cleanest if the crawler is its own service (call it `iq-search`).

> Note: it would be slick if PDAs could carry actual site info (or have a git source attached) so a Google-style result was clickable straight to the live site — not just info, but a real jump destination. Not needed for the early version though.

## Related repos

- [`iq-gateway`](https://github.com/IQCoreTeam/iq-gateway) — the data API this service calls
- [`iqlabs-solana-sdk`](https://github.com/IQCoreTeam/iqlabs-solana-sdk) — on-chain read / write
- [`iqlabs-git-sdk`](https://github.com/IQCoreTeam/iqlabs-git-sdk) — git on IQ
- `iqprofile.net` — to be absorbed

---

# Note

We're building this in small slices. v1 is just git-backed deploys with iqlabs mixed in. The bigger vision is here on paper so we don't lose it, not so we ship it next week. No stress — slow and steady.
