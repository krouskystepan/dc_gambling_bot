import { Schema, model, Document } from 'mongoose'

export type User = Document & {
  userId: string
  balance: number
}

const UserSchema = new Schema<User>({
  userId: {
    type: String,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
})

export default model<User>('User', UserSchema)
