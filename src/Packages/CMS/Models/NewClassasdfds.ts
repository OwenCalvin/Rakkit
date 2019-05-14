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
export class NewClassasdfds {
  @PrimaryGeneratedColumn()
  NewFieldasd: number;
  @Column()
  NewFieldsdASD?: string[];
  @Column()
  NewFieldSASADa: string;
}
