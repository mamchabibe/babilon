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
        "The path is not written in numbers.\nIt is sung.\n\nSix psalms guard the way.\nThree face the dawn.\nThree face the dying light.\n\nFind first:\nthe song of the wounded soul,\nthe song of the patient righteous,\nthe song that trusts not in chariots.\n\nThen find:\nthe song of the pilgrim longing for the courts,\nthe song that begs judgment on pursuers,\nthe song of the one drawn from the pit.\n\nSet the first three as North.\nSet the last three as West.\nDegrees. Minutes. Seconds.\n\nThen let the earth reveal what men forgot.",
      answer: "NOAH"
    },
    {
      number: 6,
      title: "On the top",
      points: 550,
      riddle:
        "Fools search the walls.\nThe worthy read the commands beneath them.\nMen are shown pages.\nCrawlers are warned away from kingdoms.\nGo where the machine is told not to go.",
      answer: "NEBUCHADNEZZAR"
    },
    {
      number: 7,
      title: "Revelation",
      points: 700,
      riddle:
        "GLF MQU FHNWSDD NUISY VOE INXGDR SBETNGK.\nA KNRC VRFGI XBGU GRYH FQEN YSVX.\nVOE FVXX EECY XIY PPGKG XGD STNPFM YLRH FTNJEE.\nAENY VOE VVR SGAK PVPQPLD WUI SGRFAI.\nZYV H WRHRC VIKUSVN KAS ZNPK HS R YMF.\nCP AHH SMESH TUENVGY, TKR IWHLV EIBX VOE KNRC.\n\nThe old king is dead, yet still he opens the wall.",
      answer: "pride D5"
    },
    {
      number: 8,
      title: "the great fall",
      points: 1000,
      intro:
        "The last gate does not heed your wit.\nIt will not open to guesswork, nor to tongues too eager to name what they have not read.\n\nSeven witnesses stand beyond this page.\nEach bears a wound.\nBring me not the verse, but the wound condemned within it.\n\nSeek first the saying of the king: 16:18.\nSeek second the warning of the physician: 12:15.\nSeek third the judgment of the mountain voice: 5:28.\nSeek fourth the rebuke of the brother: 3:16.\nSeek fifth the table of ruin: 23:20–21.\nSeek sixth the spark of strife: 29:22.\nSeek seventh the lesson of the smallest laborer: 6:6–11.\n\nFour times the king shall speak.\nThe physician once.\nThe mountain once.\nThe brother once.\n\nRead the witnesses.\nName the seven wounds.\nOnly then shall the fall begin.",
      chambers: [
        {
          title: "Witness I — 16:18",
          clue: "Enter the wound.",
          password: "humility",
          hiddenWord: "Saoul"
        },
        {
          title: "Witness II — 12:15",
          clue: "Enter the wound.",
          password: "generosity",
          hiddenWord: "Chosen"
        },
        {
          title: "Witness III — 5:28",
          clue: "Enter the wound.",
          password: "chastity",
          hiddenWord: "Paul"
        },
        {
          title: "Witness IV — 3:16",
          clue: "Enter the wound.",
          password: "kindness",
          hiddenWord: "MAM"
        },
        {
          title: "Witness V — 23:20-21",
          clue: "Enter the wound.",
          password: "temparance",
          hiddenWord: "God"
        },
        {
          title: "Witness VI — 29:22",
          clue: "Enter the wound.",
          password: "patience",
          hiddenWord: "Man"
        },
        {
          title: "Witness VII — 6:6-11",
          clue: "Enter the wound.",
          password: "diligence",
          hiddenWord: "Acts of the apostols"
        }
      ],
      answerPrompt: "Bring the final key.",
      answer: "instrument of god"
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
