import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  ManyToMany,
  OneToOne
} from "typeorm";

@Entity()
export class class2 {
  @PrimaryGeneratedColumn()
  NewField: number;
  @Column({ type: Number, nullable: false })
  ss1: number;
  @Column({ type: Number, nullable: false })
  NewFieldr4: number;
}
