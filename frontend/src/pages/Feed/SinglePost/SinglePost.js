import React, { Component } from 'react';

import Image from '../../../components/Image/Image';
import './SinglePost.css';

class SinglePost extends Component {
  state = {
    title: '',
    author: '',
    date: '',
    image: '',
    content: '',
  };

  componentDidMount() {
    const postId = this.props.match.params.postId;
    const url = 'http://localhost:8080/graphql';
    const graphqlQuery = {
      query: `
        query FetchPost($postId: ID!) {
          fetchPost(postId: $postId) {
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
        postId: postId
      }
    };

    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery),
    })
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        console.log('[Fetch post]: ', resData);
        if (resData.errors) {
          throw new Error('Failed to fetch status');
        }
        this.setState({
          title: resData.data.fetchPost.title,
          author: resData.data.fetchPost.creator.name,
          image: `http://localhost:8080/${resData.data.fetchPost.imageUrl}`,
          date: new Date(resData.data.fetchPost.createdAt).toLocaleDateString('en-US'),
          content: resData.data.fetchPost.content,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  render() {
    return (
      <section className="single-post">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={this.state.image} />
        </div>
        <p>{this.state.content}</p>
      </section>
    );
  }
}

export default SinglePost;
