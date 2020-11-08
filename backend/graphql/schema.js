const { buildSchema } = require('graphql');

const schema = buildSchema(`
  input UserDataInput {
    name:String!
    email:String!
    password:String!
  }

  input StatusInput {
    status: String!
  }

  input LoginDataInput {
    email: String!
    password: String!
  }

  input PostDataInput {
    title: String!
    imageUrl: String!
    content: String!
  }

  type Post {
    _id: ID!
    title: String!
    imageUrl: String!
    content: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }
  
  type PostData {
    posts: [Post!]!
    totalPosts: Int!
  }

  type User {
    _id: ID!
    email: String!
    name: String!
    password: String!
    status: String!
    posts: [Post!]!
  }

  type Auth {
    userId: String!
    token: String!
  }

  type RootQuery {
    login(loginInput: LoginDataInput!): Auth!
    fetchPosts(page: Int!): PostData!
    fetchPost(postId: ID!): Post!
    fetchUser: User!
  }

  type RootMutation {
    createUser(userInput: UserDataInput): User!
    createPost(postInput: PostDataInput): Post!
    updatePost(postInput: PostDataInput, postId: ID!): Post!
    deletePost(postId: ID!): Boolean!
    updateUserStatus(statusInput: StatusInput): User!
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);

module.exports = schema;
