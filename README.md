# Introduction
- Greeting ! This is KafkaBOT (pronounced as **kaaf·kuh**) - A simple multipurpose Discord bot that i made for fun
- Currently i've implemented custom commands register function, i'm not create a custom command because i'm lazy asf
# Slash commands
## Misc
| Command           | Description                           | Parameters                                    |
| :-----------------|:-------------------------------------:|:---------------------------------------------:|
| `/kfping`         | `Reply with Pong!`                    | `None`                                        |
| `/kfcommands`     | `Get all KafkaBOT's commands`         | `None`                                        |
| `/kfpoll`         | `Create a Poll`                       | `question` - `multi` - `duration` - `polls`   |
| `/kftft`          | `Get TFT current meta`                | `None`                                        |
| `/kfud`           | `Search a word on Urban Dictionary`   | `term`                                        |
| `/kfmeme`         | `Summon a random meme at will`        | `None`                                        |
| `/kfinfo`         | `Get user's discord info`             | `None`                                        |

## Chat
| Command           | Description                           | Parameters                                    |
| :-----------------|:-------------------------------------:|:---------------------------------------------:|
| `/kfchat`         | `Chat with AI`                        | `question`                                    |
| `/kfdraw`         | `Ask AI to draw a image`              | `idea`                                        |

## SauceNAO
| Command           | Description                           | Parameters                                    |
| :-----------------|:-------------------------------------:|:---------------------------------------------:|
| `/kfsaucenao`     | `Find sauce`                          | `attachment`                                  |

## Hoyolab
| Command           | Description                           | Parameters                                    |
| :-----------------|:-------------------------------------:|:---------------------------------------------:|
| `/kfhoyo`         | `Assign hoyolab's cookie`             | `cookie`                                      |
| `/kfhyupdate`     | `Update hoyolab's cookie`             | `cookie`                                      |
| `/kfhelp`         | `Find out how to get hoyolab's cookie`| `None`                                        |

## Wuthering Waves
| Command           | Description                           | Parameters                                    |
| :-----------------|:-------------------------------------:|:---------------------------------------------:|
| `/kfwuwa`         | `Enable WuWa new codes notification`  | `None`                                        |
| `/kfunwuwa`       | `Disable WuWa new codes notification` | `None`                                        |

# Context Menu
| Command           | Description                           | Type                                          |
| :-----------------|:-------------------------------------:|:---------------------------------------------:|
| `SauceNao`        | `Find sauce`                          | `ApplicationCommandType.Message`              |
| `Ping`            | `Replies with Pong!`                  | `ApplicationCommandType.User`                 |

# Custom commands
| Command           | Description                           | Parameters                                    |
| :-----------------|:-------------------------------------:|:---------------------------------------------:|
| `%%`              | `Save quote`                          | `identifier` - `Image, chat input or reply`   |
| `%%%`             | `Get quote`                           | `identifier`                                  |
| `%ce`             | `Currency exchange`                   | `From` - `To` - `Amount`                      |

# Dependencies
- [@discord-player/extractor](https://www.npmjs.com/package/@discord-player/extractor)
- [@discordjs/opus](https://www.npmjs.com/package/@discordjs/opus)
- [axios](https://www.npmjs.com/package/axios)
- [discord.js](https://www.npmjs.com/package/discord.js)
- [glob](https://www.npmjs.com/package/glob)
- [hercai](https://www.npmjs.com/package/hercai)
- [pg](https://www.npmjs.com/package/pg)
- [puppeteer](https://www.npmjs.com/package/puppeteer)
- [reflect-metadata](https://www.npmjs.com/package/reflect-metadata)
- [sagiri](https://www.npmjs.com/package/sagiri)
- [typeorm](https://www.npmjs.com/package/typeorm)
- [List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/tree/master)
- [Hoyolab-auto](https://github.com/torikushiii/hoyolab-auto)
- [cloudinary](https://www.npmjs.com/package/cloudinary)
- [exchange-api](https://github.com/fawazahmed0/exchange-api)


# LICENSE
MIT License

Copyright (c) 2024 Akari

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.