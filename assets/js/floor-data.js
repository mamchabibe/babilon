(function () {
  const floors = [
    {
      number: 1,
      title: "you look familiar",
      points: 100,
      riddle:
        "|ܡܪܝܡ\nSome names are not spoken. They are remembered.\nSeek the mother in the tongue of the first faithful.\nHer hymn will open the path.\nThe hymn is not the answer.\nCount what is spoken.\nOn the eleventh of the first, the gate opens.\nThere, the forgotten number waits.",
      answer: "30"
    },
    {
      number: 2,
      title: "All l be one",
      points: 150,
      intro:
        "A specialist is useful.\nAn exceptional mind is sovereign.\nEnter the five chambers.\nBring order to what lesser minds keep separate.",
      chambers: [
        {
          title: "\"simply lovely\"",
          clue: "His first crown came under desert lights."
        },
        {
          title: "He bent space and troubled the primes.",
          clue: "reduce the age at which he died."
        },
        {
          image: "../assets/images/9.png",
          imageAlt: "Ninth chamber clue"
        },
        {
          title: "Not a battle lost.\nA world dissolved.\na broken red star.",
          clue: "reduce the year it ended."
        },
        {
          title: "1, 2, 6, 15, 31, 56, ?",
          options: ["A) 88", "B) 89", "C) 90", "D) 91", "E) 92"],
          clue: "it's not the value that counts"
        }
      ],
      outro:
        "Knowledge scattered is noise.\nKnowledge ordered becomes rank.",
      answerPrompt: "Make the five speak one language.",
      answer: "ELITE"
    },
    {
      number: 3,
      title: "the golden tongue",
      points: 200,
      riddle:
        "You have heard my voice where words are chained.\nBut a voice is never the face.\nSeek the imitation that sings in squares,\nwhere the borrowed insect wears my shadow.\nThere, the next door waits.",
      answer: "euclide"
    },
    {
      number: 4,
      title: "I understand you",
      points: 300,
      intro:
        "Good.\nYou have learned to hear what lies beneath language.\nNow seek the one that does not wander.\nThe fifth path begins where the sky keeps its fixed witness.",
      chambers: [
        {
          image: "../assets/images/riddle4.png",
          imageAlt: "Fourth floor clue"
        }
      ],
      answer: "polaris"
    },
    {
      number: 5,
      title: "Aim for the sky",
      points: 400,
      riddle:
        "I am drawn below, yet I command the eye above. Every hand that seeks a summit first imagines me. What am I?",
      answer: "arrow"
    },
    {
      number: 6,
      title: "On the top",
      points: 550,
      riddle:
        "I am desired by all who climb, but I last only for the one who can remain steady when the wind arrives. What am I?",
      answer: "summit"
    },
    {
      number: 7,
      title: "Revelation",
      points: 700,
      riddle:
        "I do not create the hidden thing. I only tear the covering away. When I arrive, nothing false remains. What am I?",
      answer: "truth"
    },
    {
      number: 8,
      title: "the great fall",
      points: 1000,
      riddle:
        "The higher pride ascends, the harder I answer. I humble towers, kings, and names alike. What am I?",
      answer: "fall"
    }
  ];

  function normalizeAnswer(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, " ");
  }

  function getFloor(number) {
    return floors.find((floor) => floor.number === number) || null;
  }

  function getTotalPointsForSolvedCount(solvedCount) {
    return floors
      .filter((floor) => floor.number <= solvedCount)
      .reduce((total, floor) => total + floor.points, 0);
  }

  window.BabilonFloors = {
    floors,
    normalizeAnswer,
    getFloor,
    getTotalPointsForSolvedCount
  };
})();
