function shuffle(array: any[]): any[] {
  const shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

function randomIntFromInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export default function generateRoomName() {
  const characters = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
  ];

  var digitArray = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  var roomName =
    shuffle(digitArray).join("").substring(0, randomIntFromInterval(3, 6)) +
    shuffle(characters).join("").substring(0, randomIntFromInterval(7, 10));

  var finale = shuffle(roomName.split("")).join("");

  return finale;
}

//generateRoomName();
