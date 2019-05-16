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
  NewClass
} from "./NewClass";

@Entity()
export class NewClasss {
  @PrimaryGeneratedColumn()
  NewField: number;
  @OneToMany(type => NewClass)
  NewField2: NewClass[];
}
