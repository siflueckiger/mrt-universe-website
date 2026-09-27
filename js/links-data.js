// ==================== LINK DATA ====================
// Adding a link = adding an entry to this array.
// An optional `markdown` string is rendered in-game when the player opens
// an installation (category "Installation"); links without one get a
// generated template from their title/description.

let linkData = [
  {
    title: "Somewhere in a Carrot Field",
    url: "https://youtu.be/5aqjgMyLG5o?si=3JkD_Nx2CWLkOOVO",
    description: "Band: Artlu Bubble and the Dead Animal Gang",
    category: "Musicvideo",
  },
  {
    title: "Adolf",
    url: "https://youtu.be/zZAojfcRn14?si=UtXPR-Vnpe96I1ju",
    description: "Band: Mike Ständer Band",
    category: "Musicvideo",
  },
  {
    title: "Nothing",
    url: "https://youtu.be/Bc8TdmOhQQo?si=LW69Fu47xNoIyQrs",
    description: "Band: Shah Blah",
    category: "Musicvideo",
  },
  {
    title: "Infantiler Bullshit",
    url: "https://youtu.be/HXqHBI38OUY?si=GYdEGtdVJTHfykZz",
    description: "Band: Mike Ständer Band",
    category: "Musicvideo",
  },
  {
    title: "Puppet Factory",
    url: "https://youtu.be/oTgBFSO_Yo8?si=T9E438bC7eKgZnGi",
    description: "Band: Deserto Parallax",
    category: "Musicvideo",
  },
  {
    title: "Holy Shelter",
    url: "https://youtu.be/hDgQwmotsV4?si=4ZmQSYxVIhJvT5hP",
    description: "Band: Shah Blah",
    category: "Musicvideo",
  },
  {
    title: "Who Sells Out",
    url: "https://youtu.be/zJbVd3pLQqk?si=M9o_t8Xb-LJ4H8py",
    description: "Band: Shah Blah",
    category: "Musicvideo",
  },
  {
    title: "WeAre!",
    url: "https://flic.kr/s/aHskHQEi7K",
    description: "An alien view on the human population - Sockel - Bern",
    category: "Installation",
    markdown: `# WeAre!

## An alien view on the human population

**Venue:** Sockel — Bern
**Format:** Interactive installation

---

A stranger in a strange land looks back at us. *WeAre!* turns the
visitor into an alien anthropologist: from the outside, our everyday
gestures, habits and rituals suddenly look wildly exotic.

- **Interactive** — visitors become part of the observation
- **Playful** — a light-hearted mirror held up to humanity

> What would an extraterrestrial write in its field notes about us?

[Browse the photo gallery on Flickr](https://flic.kr/s/aHskHQEi7K)
`,
  },
  {
    title: "Play w/ your World",
    url: "https://flic.kr/s/aHsmLaiqq1",
    description: "Klimahalle - Reitschule, Grosse Halle - Bern",
    category: "Installation",
    markdown: `# Play w/ your World

## Klimahalle — Reitschule, Grosse Halle, Bern

**Venue:** Reitschule, Grosse Halle — Bern
**Format:** Interactive installation

---

A large-scale play space where the audience reshapes the room by
simply *playing*. Part arcade, part climate experiment, the
installation invites bold hands and quick reflexes.

- **Playful interaction** — movement drives the world
- **Big space** — built for the Grosse Halle

> The world is a toy. Play responsibly.

[Browse the photo gallery on Flickr](https://flic.kr/s/aHsmLaiqq1)
`,
  },
  {
    title: "AurART",
    url: "https://flic.kr/s/aHBqjzEF1c",
    description:
      "Aura-Foto-Installation - Museum für Kommunikation - Bern",
    category: "Installation",
    markdown: `# AurART

## Aura photo installation

**Venue:** Museum für Kommunikation — Bern
**Format:** Aura photo installation

---

Your energy becomes an image. *AurART* measures tiny electrical
signals from the body and translates them into a vivid **aura
portrait** — part photograph, part energy field.

- **Bio-feedback** — the body becomes the pigment
- **One of a kind** — every portrait is unique

> A self-portrait made of your own electricity.

[Browse the photo gallery on Flickr](https://flic.kr/s/aHBqjzEF1c)
`,
  },
];

// ==================== LINK DATA VALIDATION ====================
// Warns about malformed entries and drops them so one bad link
// can't break the whole game.

function validateLinkData() {
  const requiredFields = ["title", "url", "category"];
  const valid = [];
  linkData.forEach((link, index) => {
    const problems = [];
    if (!link) {
      problems.push("entry is empty");
    } else {
      requiredFields.forEach((field) => {
        if (typeof link[field] !== "string" || link[field].trim() === "") {
          problems.push('missing/invalid "' + field + '"');
        }
      });
    }
    if (problems.length > 0) {
      console.warn(
        "[linkData] entry " + index + " skipped: " + problems.join(", ")
      );
      return;
    }
    if (typeof link.description !== "string") {
      link.description = "";
    }
    // Optional markdown body: drop it if it isn't a string so the renderer
    // can safely fall back to a generated template.
    if (typeof link.markdown !== "string") {
      delete link.markdown;
    }
    valid.push(link);
  });
  return valid;
}

linkData = validateLinkData();
