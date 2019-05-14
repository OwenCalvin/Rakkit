import {
  Entity,
  Column,
  PrimaryGeneratedColumn
} from "typeorm";

@Entity()
export class Xo {
  @Column()
  NewField: string;
  @PrimaryGeneratedColumn()
  aaaaadfs: number;
  @Column()
  NewFieldr4: number;
}
