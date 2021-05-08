// Secret.js - Visualization and smart contract code for "Secret Artwork"
// Copyright (C) 2018, 2021 Rhea Myers
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

const Data = {};

Data.init = function (properties) {
  this.properties = properties;
};

const SIXTEEN_COLORS = [
  '#F0F0F0', 'silver', 'gray', 'black', 'red', 'maroon', 'yellow', 'olive',
  'lime', 'green', 'aqua', 'teal', 'blue', 'navy', 'fuschia', 'purple'
];

const SIXTEEN_GRAYS = [
  '#000', '#111', '#222', '#333', '#444', '#555', '#666', '#777',
  '#888', '#999', '#AAA', '#BBB', '#CCC', '#DDD', "#EEE", '#F0F0F0'
];

const SIXTEEN_SHAPES = ['⯀','⯁','⯂','⯃','⯄','⯅','◢','◣','◤','◥','◖','◗','⯊','⯋','▮','●'];

const SIXTEEN_DINGBATS = ['🙐','🙑','🙒','🙓','🙔','🙕','🙖','🙗','🙘','🙙','🙚','🙛','🙜','🙝','🙞','🙟'];

const SIXTEEN_EMOJI = ['😐','😑','😒','😓','😔','😕','😖','😗','😘','😙','😚','😛','😜','😝','😞','😟'];

const SIXTEEN_NOTES = ['🎜','🎝','♪','♫','♬','𝅜','𝅝','𝅗𝅥','𝅘𝅥','𝅘𝅥𝅮','𝅘𝅥𝅯','𝅘𝅥𝅰','𝅘𝅥𝅱','𝅘𝅥𝅲','𝆔','𝆕'];

Data.valueReps = [
  // Just the string
  function (string, int8s, nibbles) {
    return string.startsWith('0x') ? `<span style="font-family: Courier New,Courier,Nimbus Mono L, Lucida Sans Typewriter,Lucida Typewriter,monospace;">${string}</span>`: `<span style="font-family: Times Roman, Times New Roman,serif;">${string}</span>`;
  },
  // Colored boxes
  function (string, int8s, nibbles) {
    return nibbles.map(val => `<span style="background-color: ${SIXTEEN_COLORS[val]};">&#x2001;</span>`).join('');
  },
  // Gray boxes
  function (string, int8s, nibbles) {
    return nibbles.map(val => `<span style="background-color: ${SIXTEEN_GRAYS[val]};">&#x2001;</span>`).join('');
  },
  // Colored blobs
  function (string, int8s, nibbles) {
    return nibbles.map(val => `<span style="color: ${SIXTEEN_COLORS[val]};">&#x2B24;</span>`).join('');
  },
  // Gray blobs
  function (string, int8s, nibbles) {
    return nibbles.map(val => `<span style="color: ${SIXTEEN_GRAYS[val]};">&#x2B24;</span>`).join('');
  },
  // Shapes
  function (string, int8s, nibbles) {
    return nibbles.map(val => `${SIXTEEN_SHAPES[val]}`).join('');
  },
  // Dingbats - Unreliable on Debian :-(
  function (string, int8s, nibbles) {
    return nibbles.map(val => `${SIXTEEN_DINGBATS[val]}`).join('');
  },
  // Emoji
  function (string, int8s, nibbles) {
    return nibbles.map(val => `${SIXTEEN_EMOJI[val]}`).join('');
  },
  // Musical Notes
  function (string, int8s, nibbles) {
    return nibbles.map(val => `${SIXTEEN_NOTES[val]}`).join('');
  },
  // Different sized circles
  function (string, int8s, nibbles) {
    return '<span class="valign-content">' + nibbles.map(val => `<span style="font-size: ${val + 1}pt;">&xcirc;</span>`).join('') + '</span>';
  },
  // Different sized squares
  function (string, int8s, nibbles) {
    return '<span class="valign-content">' + nibbles.map(val => `<span style="font-size: ${val + 4}pt;">&#x25A1;</span>`).join('') + '</span>';
  },
];

Data.toInt8s = function (property) {
  let bytes = [];
  if (property.startsWith('0x')) {
    for (let i = 2; i < property.length; i += 2) {
      bytes.push(parseInt(property.slice(i, i + 2), 16));
    }
  } else {
    for (let i = 0; i < property.length; i++) {
      bytes.push(property.charCodeAt(i));
    }
  }
  return bytes;
};

Data.toNibbles = function (byteBits) {
  let nibbles = [];
  for (let i = 0; i < byteBits.length; i++) {
    nibbles.push(byteBits[i] & 0xF);
    nibbles.push(byteBits[i] >> 4);
  }
  return nibbles;
};

Data.randomPropertyName = function () {
  const names = Object.keys(this.properties);
  return names[Math.floor(Math.random() * names.length)];
};

Data.repName = function (name) {
  return `<p class="fact-title"><strong>${name} this artwork</strong></p>`;
};

Data.repValueRandomly = function (name) {
  const value = this.properties[name].toString();
  const int8s = this.toInt8s(value);
  const nibbles = this.toNibbles(int8s);
  const fun = this.valueReps[Math.floor(Math.random() * this.valueReps.length)];
  return fun(value, int8s, nibbles);
};

Data.repRandomProperty = function () {
  const name = this.randomPropertyName();
  const rep = Data.repValueRandomly(name);
  return this.repName(name) + `<p class="fact-value">${rep}</p>`;
};

const Secret = {};

Secret.UPDATE_AT_LEAST_EVERY = 4;

Secret.updating = false;
Secret.lastUpdateAt = 0;

Secret.init = function() {
  this.reveal = $('#reveal');
  this.revealBottom = this.elementBottom(this.reveal);
  this.appendInitialPaddingRows();
};

Secret.shouldUpdate = function(timestamp) {
  return (((timestamp - this.lastUpdateAt) / 1000) > this.UPDATE_AT_LEAST_EVERY)
    && (! this.updating);
};

Secret.elementBottom = function(element) {
  return element.offset().top
    + element.outerHeight(true);
};

/*Secret.revealOverflow = function() {
  return this.elementBottom($('.fact').last()) - this.revealBottom
}*/

Secret.removeOverflowFactRows = function() {
  const topFact = $('.fact').first();
  const bottomFact = $('.fact').last();
  const excess = (topFact.outerHeight(true));
  this.updating = true;
  const that = this;
  topFact.animate({'margin-top': `-${excess}`},
                  1000,
                  function () {
                    that.updating = false;
                    topFact.remove();
                  });
};

Secret.appendFactRow = function(content) {
  let overflowed = false;
  const fact = $(`<div class="fact">${content}</div>`).appendTo(this.reveal);
  const factTop = fact.position().top;
  if (factTop > this.revealBottom) {
    this.removeOverflowFactRows();
    overflowed = true;
  }
  return overflowed;
};

Secret.appendInitialPaddingRows = function() {
  while (true) {
    const overflowed = this.appendFactRow(Data.repRandomProperty());
    if (overflowed) {
      break;
    }
  }
};

Secret.update = function () {
  const timestamp = new Date().getTime();
  if (this.shouldUpdate(timestamp)) {
    this.appendFactRow(Data.repRandomProperty());
    this.lastUpdateAt = timestamp;
  }
};

const Contract = {};

Contract.somethingMappings = {
  'address': 'Ethereum address of the owner of',
  'blockHash':
  'Hash of the Ethereum block containing the transaction setting the current owner of',
  'blockNumber':
  'Height of the Ethereum block containing the transaction setting the current owner of',
  'transactionHash':
  'Hash of the Ethereum transaction setting the current owner of',
};

Contract.handleTransfer = function (error, event) {
  for (const [key, value] of Object.entries(this.somethingMappings)) {
    Data.properties[value] = event[key];
  }
};

Contract.init = function(contractJson, tokenId) {
  if(typeof window.ethereum !== 'undefined') {
    this.web3 = new Web3(Web3.givenProvider);
    //FIXME: handle chain switches.
    const chainId = parseInt(Contract.web3.eth.currentProvider.chainId, 16);
    this.contract = new this.web3.eth.Contract(
      contractJson.abi,
      contractJson.networks[chainId].address
    );
    // We get these only if the network is available, to avoid stale data.
    this.contract.getPastEvents(
      'Transfer',
      {
        filter: {
          _tokenId: tokenId
        },
        fromBlock: "earliest",
        toBlock: "latest",
      },
      function (error, events) {
        if (! error) {
          Contract.handleTransfer(error, events[events.length - 1]);
        }
      }
    );
    this.contract.events.Transfer(
      {
        filter: {
          _tokenId: tokenId
        }
      },
      Contract.handleTransfer
    );
  }
};
