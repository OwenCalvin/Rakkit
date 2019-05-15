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
export class NewClass {
  @Column({ type: Number, nullable: true })
  NewFielddfghdfh?: number[];
  @PrimaryGeneratedColumn()
  NewFielddffdg: number;
  @Column({ type: Number, nullable: true })
  NewFielddddddd?: number[];
}
