import {
  Entity,
  Column,
  PrimaryGeneratedColumn
} from "typeorm";

@Entity()
export class Xo2 {
  @PrimaryGeneratedColumn()
  NewField: number;
}
