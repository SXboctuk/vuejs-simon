<template>
  <div class="simon-game">
    <template v-if="!isGameInit">
      <button class="simon-game__button" @click="initGame">start</button></template
    >
    <template v-else>
      <div class="simon-game__buttons">
        <AppSimonButton
          v-for="(button, index) in buttons"
          :key="button.id"
          :color="button.color"
          @click="buttonClick(index)"
          :active="activeSectorIndex === index"
          :disabled="!isPlayable"
        />
      </div>
      <div class="simon-game__info">
        <template v-if="isFirstPlay"
          ><div>
            <button class="simon-game__button" @click="startGame">Start game</button>
          </div></template
        >
        <template v-else-if="isUserLose">
          <p>
            Your score <b>{{ currentRound }} </b>!!!
          </p>
          <div><button class="simon-game__button" @click="startGame">Try again</button></div>
        </template>
        <template v-else
          ><div>Current round: {{ currentRound }}</div></template
        >
        <div class="simon-game__options" :class="{ 'simon-game__options--disabled': isGameOn }">
          <div>
            <input
              class="simon-game__radio"
              type="radio"
              v-model="playbackTime"
              id="easy"
              :value="1.5"
            />
            <label class="simon-game__label" for="easy">easy</label>
          </div>
          <div>
            <input
              class="simon-game__radio"
              type="radio"
              v-model="playbackTime"
              id="normal"
              :value="1"
            />
            <label class="simon-game__label" for="normal">normal</label>
          </div>
          <div>
            <input
              class="simon-game__radio"
              type="radio"
              v-model="playbackTime"
              id="hard"
              :value="0.4"
            />
            <label class="simon-game__label" for="hard">hard</label>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { promiseQueue } from '@/utils/promiseQueue';
import AppSimonButton from '@/components/AppSimonButton.vue';

const SMOOTH_INTERVAL = 0.1;
const SOUND_PLAY_LENGTH = 0.2;
const SOUND_MAX_GAIN = 0.5;

const DELAY_BETWEEN_SECTORS = 0.4;

export default {
  name: 'AppSimonGame',
  components: {
    AppSimonButton,
  },
  data() {
    return {
      audioContext: null,

      isGameInit: false,
      isFirstPlay: true,
      isGameOn: false,
      isPlayable: false,
      isUserLose: false,

      playbackTime: 1,

      buttonsNums: 4,
      buttons: [],

      activeSectorIndex: -1,
      roundNumber: 0,

      userSelectedArray: [],
      gameSelectedArray: [],
    };
  },
  computed: {
    currentRound() {
      return this.roundNumber + 1;
    },
  },
  methods: {
    initGame() {
      this.audioContext = new AudioContext();

      this.buttons = [...Array(this.buttonsNums)].map((_, i) => {
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(this.audioContext.destination);

        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 200 + 100 * (i + 1);
        osc.connect(gainNode);
        osc.start();

        let timeoutId = null;

        const silenceSound = () => {
          clearTimeout(timeoutId);
          gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, SMOOTH_INTERVAL);
        };
        const playSound = (playTime = SOUND_PLAY_LENGTH) => {
          gainNode.gain.setTargetAtTime(
            SOUND_MAX_GAIN,
            this.audioContext.currentTime,
            SMOOTH_INTERVAL,
          );
          timeoutId = setTimeout(silenceSound, playTime * 1000);
        };

        return {
          id: i,
          color: `hsl(${(i * 360) / this.buttonsNums}, 100%, 50%)`,
          gainNode: gainNode,
          osc: osc,
          soundPlay: (playTime) => {
            if (timeoutId) {
              silenceSound();
            }
            playSound(playTime);
          },

          soundSilence: silenceSound,
        };
      });

      this.isGameInit = true;
    },
    getRandomSector() {
      return Math.floor(Math.random() * this.buttonsNums);
    },
    startGame() {
      this.roundNumber = 0;
      this.userSelectedArray = [];
      this.gameSelectedArray = [];
      this.isUserLose = false;
      this.isPlayable = false;
      this.activeSectorIndex = -1;
      this.isGameOn = true;

      this.gameSelectedArray.push(this.getRandomSector());

      this.playSelectedSectors();
    },
    getPlayQueue() {
      const queue = [];

      this.gameSelectedArray.forEach((sector) => {
        queue.push(() => {
          return new Promise((resolve) => {
            this.activeSectorIndex = -1;
            setTimeout(() => {
              this.activeSectorIndex = this.buttons[sector].id;
              this.buttons[sector].soundPlay(this.playbackTime);
              setTimeout(() => {
                resolve();
              }, this.playbackTime * 1000);
            }, DELAY_BETWEEN_SECTORS * 1000);
          });
        });
      });

      return queue;
    },
    playSelectedSectors() {
      const promiseFunctions = this.getPlayQueue();

      promiseQueue(promiseFunctions).then(() => {
        this.isPlayable = true;
        this.activeSectorIndex = -1;
      });
    },
    silenceAllButtons() {
      this.buttons.forEach((button) => {
        button.soundSilence();
      });
    },
    buttonClick(index) {
      this.silenceAllButtons();
      this.buttons[index].soundPlay();
      this.userSelectedArray.push(index);
    },
    win() {
      this.roundNumber += 1;
      this.userSelectedArray = [];
    },
    lose() {
      this.isUserLose = true;
      this.isGameOn = false;
    },
  },
  watch: {
    userSelectedArray: function () {
      if (this.userSelectedArray.length === 0) return;

      this.isPlayable = false;
      if (this.userSelectedArray.length === this.gameSelectedArray.length) {
        if (this.userSelectedArray.join('') === this.gameSelectedArray.join('')) {
          this.win();
        } else {
          this.lose();
        }
      } else {
        if (
          this.userSelectedArray.join('') ===
          this.gameSelectedArray.slice(0, this.userSelectedArray.length).join('')
        ) {
          this.isPlayable = true;
        } else {
          this.lose();
        }
      }
    },
    roundNumber: function () {
      if (this.roundNumber === 0) return;

      this.gameSelectedArray.push(this.getRandomSector());
      this.playSelectedSectors();
    },
    isGameOn: {
      handler: function () {
        this.isFirstPlay = false;
      },
    },
  },
};
</script>

<style scoped>
.simon-game {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  height: 100%;
}
.simon-game__button {
  padding: 12px 16px;
  border: none;
  outline: none;

  font-size: 16px;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 4px;
  color: white;
  background-color: burlywood;
}
.simon-game__buttons {
  max-width: 300px;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
}
.simon-game__buttons > * {
  flex: 0 1 calc(100% / (v-bind(buttonsNums) / 2));
}
.simon-game__info {
  display: flex;
  flex-direction: column;
  max-width: 300px;
  width: 100%;
  gap: 12px;
}
.simon-game__options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  opacity: 1;
}
.simon-game__options--disabled {
  pointer-events: none;
  opacity: 0.6;
}
.simon-game__label {
}
.simon-game__radio {
  margin-right: 8px;
}
</style>
