interface DropChance {
    drop: string;
    chance: string;
    rotation?: null | "Rotation A" | "Rotation B" | "Rotation C";
}

interface Rotation {
    rotation: "Rotation A" | "Rotation B" | "Rotation C";
    drops: Array<DropChance>
}

interface Mission {
    location: string;
    rotations: null | 2 | 3;
    drops: Array<DropChance>;
    rotationList: Array<Rotation>;

}

interface Relic {
    era: "Axi" | "Lith" | "Neo" | "Meso" | "Requiem" | "Relic";
    name: string;
    refinement: "Intact" | "Exceptional" | "Flawless" | "Radiant";
    drops: [ DropChance, DropChance, DropChance, DropChance, DropChance, DropChance ];
}

type MissionList = Array<Mission>

type RelicList = Array<Relic>

type KeyList = Array<Mission>

type TransientList = Array<Mission>

type SortieRewards = Mission