//Override Math.random
(function() {
  var rng = window.crypto || window.msCrypto;
  if (rng === undefined)
    return;

  Math.random = function() {
    return rng.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  };
})();

$(document).ready(function() {
  validate();
});

// save image for winners
function saveAs(uri, filename) {
  let link = document.createElement('a');
  if (typeof link.download === 'string') {
    link.href = uri;
    link.download = filename;
    //Firefox requires the link to be in the body
    document.body.appendChild(link);
    //simulate click
    link.click();
    //remove the link when done
    document.body.removeChild(link);
  } else {
    window.open(uri);
  }
}

// validate upon page load to handle errors
function validate() {
  $('#entries, #entrant-name').keyup(function() {
    if ($(this).val() == '') {
      $('.enable').prop('disabled', true);
    } else {
      $('.enable').prop('disabled', false);
    }
  });
}

// declare empty raffle array
let raffleArray = [];
let winnerHasBeenDrawn = false;
let currentWinners = null;

// function to randomize array
const randomize = array => {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// function to get random number.
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// function to parse uploaded csv file
const csvStringToArray = strData =>
{
  const objPattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\\,\\r\\n]*))"),"gi");
  let arrMatches = null, arrData = [[]];
  while (arrMatches = objPattern.exec(strData)){
    if (arrMatches[1].length && arrMatches[1] !== ",")arrData.push([]);
    arrData[arrData.length - 1].push(arrMatches[2] ?
      arrMatches[2].replace(new RegExp( "\"\"", "g" ), "\"") :
      arrMatches[3]);
  }
  return arrData;
};

// function to convert parsed array into entries
const parseArrayEntries = arr => {
  let entries = [];
  if (!arr[0] || !arr[0][1] || arr[0][1] !== 'ENTRIES') {
    return entries;
  } else {
    for(let i = 1; i < arr.length; i++) {
      const entry = arr[i];
      if(!entry) {
        return entries;
      }

      const name = entry[0];
      const score = entry[1];

      for(let j = 0; j < score; j++) {
        entries.push(name);
      }
    }
    return entries;
  }
};

// function for calculating the odds of winning for each entrant and writing it to the page.
const handleOdds = () => {
  const raffleClone = [...raffleArray];
  // This flattens it into one large array.
  const randomizedArray = randomize(raffleClone);
  const entrantTotal = randomizedArray.reduce((obj, item) => {
    obj[item] = (obj[item] || 0) + 1;
    return obj;
  }, {});
  return {
    entrantTotal,
    raffleClone
  };
};

// function to handle the total count for each entrant and write it to page along with the total entries
const handleCount = (entrantTotal, raffleClone) => {
  $('#count').empty();
  const entryCount = JSON.stringify(entrantTotal);
  // returns a stringified object from the handleOdds function.
  // the keys are the names and the values are the count. ex. {"josh":5}
  const formattedEntryCount = entryCount
    .slice(1, -1)
    .replace(/\"/g, ' ')
    .replace(/ :/g, ': ')
    .split(',');
  // returns an array of the entryCounts as strings formatted like this: [" josh: 5", " kenny: 6"]
  formattedEntryCount.forEach(count => {
    count = count.trim();
    // removes whitespace from beginning of each formattedEntryCount
    const id = count.substring(0, count.indexOf(':'));
    // returns the name as a string like "josh" by trimming the colon and anything after it.
    // used to match id of count to delete button and filter the array accordingly.
    if (raffleClone.length > 0) {
      $('#count')
        .append(
          `<hr><span id="${id}" class="delete-entry m-1 ml-1 float-left btn btn-sm btn-outline-danger" value="${id}">X</span><div class="names m-1 ${className(
            'black'
          )}">${count}</div>`
        )
        .addClass(`border-left border-right border-light`);
    }
  });
  $('#count')
    .append(`<hr>`);
  $('#total-entries').html(
    `<div class="${className('black')}">Total Entries: ${
      raffleClone.length
    }</div>`
  );
  $('#pick-winner').prop('disabled', false);
  $('.alert').alert('close');
};

const displayDrawnWinners = function(winners, color, exclamation) {
  $('#winner').html(
    `<div class="${className(color)}">${winners[0]}${exclamation}</div>
     <div class="${className(color)}">${winners[1]}${exclamation}</div>
     <div class="${className(color)}">${winners[2]}${exclamation}</div>
     <div class="${className(color)}">${winners[3]}${exclamation}</div>
     <div class="${className(color)}">${winners[4]}${exclamation}</div>
     <div class="${className(color)}">${winners[5]}${exclamation}</div>
     <div class="${className(color)}">${winners[6]}${exclamation}</div>
     <div class="${className(color)}">${winners[7]}${exclamation}</div>
     <div class="${className(color)}">${winners[8]}${exclamation}</div>
     <div class="${className(color)}">${winners[9]}${exclamation}</div>`
  );
};

const drawNWinners = function(list, numOfWinners) {
  let winners = [];
  for (let i = 0; i <= numOfWinners; i++) {
    let potentialWinner = list[getRandomInt(0, list.length - 1)];
    while (list.length >= numOfWinners && winners.indexOf(potentialWinner) !== -1) {
      potentialWinner = list[getRandomInt(0, list.length - 1)];
    }
    winners.push(potentialWinner);
  }
  return winners;
};

// function to pick a winner and create a ticker "animation" on the page before displaying the winner.
const pickWinner = () => {
  $('#pick-winner').prop('disabled', true);

  const duration = $( "#duration" ).slider( "value" );
  const delay = $( "#delay" ).slider( "value" );

  const raffleClone = [...raffleArray];
  const random = randomize(raffleClone);

  let drawnWinners = drawNWinners(random, 10);

  const interval = window.setInterval(() => {
    drawnWinners = drawNWinners(random, 10);
    displayDrawnWinners(drawnWinners, 'white', '');
    window.setTimeout(() => {
      clearInterval(interval);
    }, duration*1000);
  }, 100);

  setTimeout(() => {
    const slowInterval = window.setInterval(() => {
      drawnWinners = drawNWinners(random, 10);
      displayDrawnWinners(drawnWinners, 'white', '');
      window.setTimeout(() => {
        clearInterval(slowInterval);
      }, delay*1000);
    }, 500);
  }, duration*1000);

  window.setTimeout(() => {
    displayDrawnWinners(drawnWinners, 'blue', '!');
    winnerHasBeenDrawn = true;
    currentWinners = drawnWinners;
    $('#pick-winner').prop('disabled', true);
    $('#thankyou-next').prop('disabled', false);
    confetti.start();
  }, duration*1000 + delay*1000 + 650 );

};

// function to reset entries
const resetEntries = () => {
  raffleArray = [];
  winnerHasBeenDrawn = false;
  currentWinners = null;
  $('#total-entries, #count, #winner').empty();
  $('#pick-winner').prop('disabled', true);
  $('#thankyou-next').prop('disabled', true);
};

// function to remove winner
const removeWinner = (event) => {
  $('#count, #winner').empty();
  const { id } = event.target;
  const array = [...raffleArray];
  raffleArray = array.filter(name => name !== id);
  const { entrantTotal, raffleClone } = handleOdds();
  handleCount(entrantTotal, raffleClone);
  const spanId = `#${id}`;
  $(spanId).hide();
};

// function for quickly writing bootstrap badge color classes
const className = color => {
  let classes = 'badge badge-';
  classes +=
    color === 'green'
      ? 'success'
      : color === 'red'
      ? 'danger'
      : color === 'white'
      ? 'light'
      : color === 'yellow'
      ? 'warning'
      : color === 'blue'
      ? 'primary'
      : 'dark';
  return classes;
};

// function for handling input file
const handleFileSelect = () => {
  if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
    alert('The File APIs are not fully supported in this browser.');
    return;
  }
  let input = document.getElementById('fileinput');
  if (!input) {
    alert("Um, couldn't find the fileinput element.");
  }
  else if (!input.files) {
    alert("This browser doesn't seem to support the `files` property of file inputs.");
  }
  else if (!input.files[0]) {
    alert("Please select a file before clicking 'Load'");
  }
  else {
    if ( raffleArray.length > 0 ) {
      $('#load-entries').prop('disabled', true);
      $('.load-msg').html(
        `<p id="no-save"><b>Entries are already loaded. Reset or refresh page to load new data.</b></p>`
      );
      $('.load-footer').append(
        `<button class="btn btn-primary refresh">Refresh Page</button>`
      );
    } else {
      let file = input.files[0];
      let fr = new FileReader();
      fr.onload = function () {
        let parsedArray = parseArrayEntries(csvStringToArray(fr.result));
        if ( parsedArray.length > 0) {
          $('#load-entries').prop('disabled', false);
          parsedArray.forEach(name => {
            raffleArray.push(name);
          });
          const { entrantTotal, raffleClone } = handleOdds();
          handleCount(entrantTotal, raffleClone);
          $('.load-msg').html(
            `<p id="no-save"><b>Raffle entries have been loaded successfully.</b></p>`
          );
          window.setTimeout(function() {
            if ($('.load-modal').hasClass('show')) {
              $('.load-modal').modal('toggle');
            }
          }, 1250)
        } else {
          $('.load-msg').html(
            `<p id="no-save"><b>Uploaded entries are malformed. Please check and try again.</b></p>`
          );
        }
      };
      fr.readAsText(file);
    }
  }
};

$( function() {
  $( "#duration" ).slider({
    range: "max",
    min: 5,
    max: 20,
    value: 10,
    slide: function( event, ui ) {
      $( "#slider1value" ).val( ui.value );
    }
  });
  $( "#slider1value" ).val( $( "#duration" ).slider( "value" ) );
} );

$( function() {
  $( "#delay" ).slider({
    range: "max",
    min: 5,
    max: 15,
    value: 5,
    slide: function( event, ui ) {
      $( "#slider2value" ).val( ui.value );
    }
  });
  $( "#slider2value" ).val( $( "#delay" ).slider( "value" ) );
} );

$('#pick-winner').on('click', event => {
  event.preventDefault();
  if (raffleArray.length > 0) {
    pickWinner();
  }
});

$('#thankyou-next').on('click', event => {
  event.preventDefault();
  confetti.stop();
  winnerHasBeenDrawn = false;
  currentWinners = null;
  drawnEntry = null;
  $('#pick-winner').prop('disabled', false);
  $('#thankyou-next').prop('disabled', true);


  html2canvas($("#winner-container"), {
    onrendered: function(canvas) {
      theCanvas = canvas;
      document.body.appendChild(canvas);
      // Convert and download as image
      saveAs(canvas.toDataURL(), 'tiwala-consolation-winners.png');
      // Clean up
      document.body.removeChild(canvas);
    }
  });

});

// resets everything, all current entries and clears local storage.
// button exists on main page.
$('#reset').on('click', () => {
  $('.reset-modal').modal();
  resetEntries();
  localStorage.clear();
});

// load button launches modal, empties message div, and removes refresh button. button exists on main page.
$('.load-btn').on('click', () => {
  $('#no-save').empty();
  $('.refresh').remove();
  $('.load-modal').modal();
});

// displays next to entry counts, matches id with name in array,
// filters out the name, sets the main array to the filtered array, and runs the odds and count functions.
$(document).on('click', '.delete-entry', removeWinner);

// will refresh the page.
$(document).on('click', '.refresh', () => {
  window.location.reload();
});
