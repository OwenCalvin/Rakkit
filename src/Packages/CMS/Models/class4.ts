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
  class30
} from "./class30";

@Entity()
export class class4 {
  @PrimaryGeneratedColumn()
  NewField: number;
  @Column({ type: Number, nullable: false })
  aaaaadfs: number;
  @ManyToOne(type => class30)
  NewFieldr4: class30;
}
