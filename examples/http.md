### Tweeting
Retrieve, post, and search tweets.

&#x20;<a href="#api-GET-username-tweets" name="api-GET-username-tweets">#</a> <b>GET</b> /`:username`/tweets  
Get all of a user's tweets, ever! Returns: 

```js
{
  "tweets": [
    {
      "status": "Everything happens so much",
      "datetime": "2013-09-03T00:00:00",
      "username": "horse_ebooks" 
    }
    ...
  ]
}
```
