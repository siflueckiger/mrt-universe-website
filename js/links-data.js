// ==================== LINK DATA ====================
// Adding a link = adding an entry to this array.
// Installations (category "Installation") open an in-game markdown reader.
// Put the prose in installations/<name>.md and point `markdownFile` at it
// (omit it and the file is derived from the title, e.g. "WeAre!" ->
// installations/weare.md). An inline `markdown` string still works as a
// fallback and is used if the file can't be loaded.

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
    markdownFile: "installations/weare.md",
  },
  {
    title: "Play w/ your World",
    url: "https://flic.kr/s/aHsmLaiqq1",
    description: "Klimahalle - Reitschule, Grosse Halle - Bern",
    category: "Installation",
    markdownFile: "installations/play-w-your-world.md",
  },
  {
    title: "AurART",
    url: "https://flic.kr/s/aHBqjzEF1c",
    description:
      "Aura-Foto-Installation - Museum für Kommunikation - Bern",
    category: "Installation",
    markdownFile: "installations/aurart.md",
  },
  {
    title: "TG53 aka Gähn Zzzz Bäng",
    url: "https://tg53.netlify.app/",
    description: "aka puzzle palooza - video works for an art installation",
    category: "Installation",
    markdownFile: "installations/tg53.md",
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
    // Optional markdown body/file: drop them if they aren't strings so the
    // renderer can safely fall back to a generated template.
    if (typeof link.markdown !== "string") {
      delete link.markdown;
    }
    if (typeof link.markdownFile !== "string") {
      delete link.markdownFile;
    }
    valid.push(link);
  });
  return valid;
}

linkData = validateLinkData();
