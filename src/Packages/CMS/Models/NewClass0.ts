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
export class NewClass0 {
  @PrimaryGeneratedColumn()
  ID: number;
  @Column({ type: String, nullable: true })
  NewField1?: string;
  @Column({ type: Number, nullable: true })
  NewField2?: number;
}
