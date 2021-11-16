import Camera from "./Camera";
import Wanderer from "../creature/Wanderer";
import { FRAME_PER_SEC } from "../lib/Constants";

class RoomClient {
  constructor(roomId) {
    // console.log("Room init", roomId);
    this.roomId = roomId;
    this.camera = new Camera();
    this.initFieldState();
    this.interval = undefined;
  }

  initFieldState() {
    // TODO: 서버에서 해당 어항에 포함된 몬스터들을 가져오기
    const state = {
      monsters: {},
    };
    this.fieldState = state;
  }

  syncFieldState = (socketState) => {
    const monsterLength = Object.keys(socketState.monsters).length;
    console.log("[socket] syncFieldState:", socketState);
    if (monsterLength <= 0) {
      console.error("ERROR!! zero monster issue should be fixed!!");
      return;
    }
    // monster를 하나씩 업데이트
    for (let monId in socketState.monsters) {
      // socket에서 받아온 monster plain object
      const monPlain = socketState.monsters[monId];
      // 해당 monster가 없는 경우 object 생성해 추가
      if (!(monId in this.fieldState.monsters)) {
        const monster = new Wanderer({
          userId: monPlain.userId,
          monId: monPlain.monId,
        });
        monster.overwrite(monPlain);
        this.fieldState.monsters[monId] = monster;
      }
      // 기존에 있던 경우 일부만 변경
      else {
        this.fieldState.monsters[monId].sync(monPlain);
      }
    }
    // this.fieldState = socketState;
  };

  updateGameState() {
    for (let monId in this.fieldState.monsters) {
      let mon = this.fieldState.monsters[monId];
      mon.run();
    }
  }

  start() {
    console.log("[room] start", this.roomId);
    this.interval = setInterval(
      () => this.updateGameState(),
      1000 / FRAME_PER_SEC
    );
  }

  close() {
    console.log("[room] close", this.roomId);
    clearInterval(this.interval);
  }
}

export default RoomClient;
