import React, { Component, Fragment } from 'react';

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false,
  };

  componentDidMount() {
    const graphqlQuery = {
      query: `{
        fetchUser {
          status
        }
      }`
    };
    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        if (resData.errors) {
          throw new Error('Failed to fetch user status.');
        }
        this.setState({ status: resData.data.fetchUser.status });
      })
      .catch(this.catchError);

    this.loadPosts();
  }

  loadPosts = (direction) => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    if (direction === 'next') {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }
    const url = `http://localhost:8080/graphql`;
    const graphqlQuery = {
      query: `
        query FetchPosts($page: Int!) {
          fetchPosts(page: $page) {
            posts {
              _id
              title
              imageUrl
              content
              creator {
                name
              }
              createdAt
            }
            totalPosts
          }
        }
      `,
      variables: {
        page: page,
      }
    };
    fetch(url, {
      method: "POST",
      headers: {
        Authorization: 'Bearer' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        console.log('[loadPosts]: ', resData);
        if (resData.errors) {
          throw new Error('Failed to fetch posts.');
        }
        this.setState({
          posts: resData.data.fetchPosts.posts.map((post) => {
            return {
              ...post,
              imagePath: post.imageUrl,
            };
          }),
          totalPosts: resData.data.fetchPosts.totalPosts,
          postsLoading: false,
        });
      })
      .catch(this.catchError);
  };

  statusUpdateHandler = (event) => {
    event.preventDefault();
    const { status } = this.state;
    const graphqlQuery = {
      query: `
        mutation UpdateUserStatus($status: String!) {
          updateUserStatus(statusInput: { status: $status }) {
            status
          }
        }
      `,
      variables: {
        status: status
      }
    }
    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        if (resData.errors) {
          throw new Error("Can't update status!");
        }
        this.setState({ status: resData.data.updateUserStatus.status })
      })
      .catch(this.catchError);
  };

  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditPostHandler = (postId) => {
    this.setState((prevState) => {
      const loadedPost = { ...prevState.posts.find((p) => p._id === postId) };

      return {
        isEditing: true,
        editPost: loadedPost,
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = (postData) => {
    console.log('[finishEditHandler]: ', postData);
    this.setState({
      editLoading: true,
    });
    // Set up data (with image!)
    const formData = new FormData();
    formData.append('image', postData.image);
    if(this.state.editPost) {
      formData.append('oldPath', this.state.editPost.imagePath);
    };

    fetch('http://localhost:8080/post-image', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer' + this.props.token,
      },
      body: formData
    })
    .then((res) => {
      return res.json()
    })
    .then((fileResData) => {
      const imageUrl = fileResData.filePath || 'undefined';
      // Setup GraphQL Query
      let graphqlQuery = {
        query: `
          mutation CreatePost($title: String!, $content: String!, $imageUrl: String!) {
            createPost(postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
              _id
              title
              imageUrl
              content
              creator {
                name
              }
              createdAt
            }
          }
        `,
        variables: {
          title: postData.title,
          content: postData.content,
          imageUrl: imageUrl
        }
      }

      if (this.state.editPost) {
        graphqlQuery = {
          query: `
          mutation UpdatePost($title: String!, $content: String!, $imageUrl: String!, $postId: ID!) {
              updatePost(postInput: { title: $title, content: $content, imageUrl: $imageUrl }, postId: $postId) {
                _id
                title
                imageUrl
                content
                creator {
                  name
                }
                createdAt
              }
            }
          `,
          variables: {
            title: postData.title,
            content: postData.content,
            imageUrl: imageUrl,
            postId: this.state.editPost._id
          }
        }
      }

      return fetch('http://localhost:8080/graphql', {
        method: 'POST',
        body: JSON.stringify(graphqlQuery),
        headers: {
          Authorization: 'Bearer' + this.props.token,
          'Content-Type': 'application/json'
        },
      })
    })
    .then((res) => {
      return res.json();
    })
    .then((resData) => {
      console.log('[finishEditHandler resData]:', resData);
      if (resData.errors && resData.errors[0].status !== 200 && resData.errors[0].status !== 201) {
        throw new Error('Creating or editing a post failed!');
      }
      if (resData.errors) {
        throw new Error('Creating post failed');
      }

      let resDataField =  this.state.editPost ? 'updatePost' : 'createPost';
      const post = {
        _id: resData.data[resDataField]._id,
        title: resData.data[resDataField].title,
        imagePath: resData.data[resDataField].imageUrl,
        content: resData.data[resDataField].content,
        creator: resData.data[resDataField].creator.name,
        createdAt: resData.data[resDataField].createdAt,
      };

      this.setState((prevState) => {
        let updatedPosts = [...prevState.posts];
        let updatedTotalPosts = prevState.totalPosts;

        if (prevState.editPost) {
          const postIndex = updatedPosts.findIndex(post => post._id === prevState.editPost._id);
          updatedPosts[postIndex] = post
        } else {
          updatedTotalPosts++;
          if (prevState.posts.length >= 2) {
            updatedPosts.pop(post);
          }
          updatedPosts.unshift(post);
        }
        return {
          posts: updatedPosts,
          isEditing: false,
          editPost: null,
          editLoading: false,
        };
      });
    })
    .catch((err) => {
      console.log(err);
      this.setState({
        isEditing: false,
        editPost: null,
        editLoading: false,
        error: err,
      });
    });
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = (postId) => {
    this.setState({ postsLoading: true });
    const URL = `http://localhost:8080/graphql`;
    const graphqlQuery = {
      query: `
        mutation {
          deletePost(postId: "${postId}")
        }
      `
    }
    fetch(URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        if (resData.erros) {
          throw new Error('Deleting a post failed!');
        }
        this.loadPosts();
      })
      .catch((err) => {
        console.log(err);
        this.setState({ postsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = (error) => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map((post) => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
