import { GameObjectDefs } from "../../../shared/defs/gameObjectDefs";
import { MapDefs } from "../../../shared/defs/mapDefs";
import { type Game } from "../game";
import { GameConfig } from "../../../shared/gameConfig";
import { type Circle, coldet } from "../../../shared/utils/coldet";
import { collider } from "../../../shared/utils/collider";
import { util } from "../../../shared/utils/util";
import { v2, type Vec2 } from "../../../shared/utils/v2";
import { BaseGameObject, ObjectType } from "./gameObject";
import { Obstacle } from "./obstacle";
import { Structure } from "./structure";

export class Loot extends BaseGameObject {
    bounds = collider.createCircle(v2.create(0.0, 0.0), 3.0);

    override readonly __type = ObjectType.Loot;

    isPreloadedGun = false;
    ownerId = 0;
    isOld = false;

    layer: number;
    type: string;
    count: number;

    vel = v2.create(0, 0);
    oldPos = v2.create(0, 0);

    collider: Circle;

    dragConstant: number;

    get pos() {
        return this.collider.pos;
    }

    set pos(pos: Vec2) {
        this.collider.pos = pos;
    }

    ticks = 0;

    constructor(game: Game, type: string, pos: Vec2, layer: number, count: number, pushSpeed = 2) {
        super(game, pos);

        const def = GameObjectDefs[type];
        if (!def) {
            throw new Error(`Invalid loot with type ${type}`);
        }

        this.layer = layer;
        this.type = type;
        this.count = count;

        this.collider = collider.createCircle(pos, GameConfig.lootRadius[def.type]);

        this.dragConstant = Math.exp(-3.69 / game.config.tps);

        this.push(v2.randomUnit(), pushSpeed);
    }

    update(): void {
        if (this.ticks > 2) this.isOld = true;
        else this.ticks++;
        const moving = Math.abs(this.vel.x) > 0.001 ||
            Math.abs(this.vel.y) > 0.001 ||
            !v2.eq(this.oldPos, this.pos);

        if (!moving) return;

        this.oldPos = v2.copy(this.pos);

        const halfDt = this.game.dt / 2;

        const calculateSafeDisplacement = (): Vec2 => {
            let displacement = v2.mul(this.vel, halfDt);
            if (v2.lengthSqr(displacement) >= 1) {
                displacement = v2.normalizeSafe(displacement);
            }

            return displacement;
        };

        this.pos = v2.add(this.pos, calculateSafeDisplacement());
        this.vel = v2.mul(this.vel, this.dragConstant);

        this.pos = v2.add(this.pos, calculateSafeDisplacement());
        this.game.map.clampToMapBounds(this.pos);

        const objects = this.game.grid.intersectCollider(this.collider);
        for (const obj of objects) {
            if (
                moving &&
                obj instanceof Obstacle &&
                !obj.dead &&
                util.sameLayer(obj.layer, this.layer) &&
                obj.collidable &&
                coldet.test(obj.collider, this.collider)
            ) {
                const res = collider.intersectCircle(obj.collider, this.collider.pos, this.collider.rad);
                if (res) {
                    this.pos = v2.add(this.pos, v2.mul(res.dir, res.pen));
                }
            }

            if (obj instanceof Loot && obj !== this && coldet.test(this.collider, obj.collider)) {
                const res = coldet.intersectCircleCircle(this.pos, this.collider.rad, obj.pos, obj.collider.rad);
                if (res) {
                    this.vel = v2.sub(this.vel, v2.mul(res.dir, 0.2));
                }

                const dist = Math.max(v2.distance(obj.pos, this.pos), 1);
                const vecCollision = v2.create(obj.pos.x - this.pos.x, obj.pos.y - this.pos.y);
                const vecCollisionNorm = v2.create(vecCollision.x / dist, vecCollision.y / dist);
                const vRelativeVelocity = v2.create(this.vel.x - obj.vel.x, this.vel.y - obj.vel.y);

                const speed = (vRelativeVelocity.x * vecCollisionNorm.x + vRelativeVelocity.y * vecCollisionNorm.y);

                if (speed < 0) continue;

                this.vel.x -= speed * vecCollisionNorm.x;
                this.vel.y -= speed * vecCollisionNorm.y;
                obj.vel.x += speed * vecCollisionNorm.x;
                obj.vel.y += speed * vecCollisionNorm.y;
            }
        }

        const river = this.game.map.getGroundSurface(this.pos, 0).river;
        if (river) {
            const tangent = river.spline.getTangent(
                river.spline.getClosestTtoPoint(this.pos)
            );
            this.push(tangent, 0.5 * this.game.dt);
        }

        let onStair = false;
        const originalLayer = this.layer;
        const objs = this.game.grid.intersectCollider(this.collider);
        for (const obj of objs) {
            if (obj instanceof Structure) {
                for (const stair of obj.stairs) {
                    if (Structure.checkStairs(this.collider, stair, this)) {
                        onStair = true;
                        break;
                    }
                }
                if (!onStair) {
                    if (this.layer === 2) this.layer = 0;
                    if (this.layer === 3) this.layer = 1;
                }
                if (this.layer !== originalLayer) {
                    this.setDirty();
                }
            }
        }

        if (!v2.eq(this.oldPos, this.pos)) {
            this.setPartDirty();
            this.game.grid.updateObject(this);
        }
    }

    push(dir: Vec2, velocity: number): void {
        this.vel = v2.add(this.vel, v2.mul(dir, velocity));
    }
}

export function getLootTable(modeName: keyof typeof MapDefs, tier: string): Array<{ name: string, count: number }> {
    const lootTable = MapDefs[modeName].lootTable[tier];
    const items: Array<{ name: string, count: number }> = [];

    if (!lootTable) {
        console.warn(`Unknown loot tier with type ${tier}`);
        return [];
    }

    const weights: number[] = [];

    const weightedItems: Array<{ name: string, count: number }> = [];
    for (const item of lootTable) {
        weightedItems.push({
            name: item.name,
            count: item.count
        });
        weights.push(item.weight);
    }

    const item = util.weightedRandom(weightedItems, weights);

    if (item.name.startsWith("tier_")) {
        items.push(...getLootTable(modeName, item.name));
    } else if (item.name) {
        items.push(item);
    }

    return items;
}
