import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  ManyToMany,
  OneToOne
} from "typeorm";
import {
  class4
} from "./class4";

@Entity()
export class class30 {
  @PrimaryGeneratedColumn()
  NewField: number;
  NewField2: class4;
}
