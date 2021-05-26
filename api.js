var request = require('request');
const _fields = {
    'foldername':'path',
    "filename": "name",
    "directlink": "url",
    "date": "date",
    "size": "size",
    "thumbUrl": "thumbUrl"
}

module.exports = function (req, res, next) {
    try {
        var params = req.query,
            id = params.id,
            sheet = params.sheet || 1,
            query = params.q,
            useIntegers = params.integers || true,
            showRows = params.rows || true,
            showColumns = params.columns || true,
            currentPath = '',
            url = 'https://spreadsheets.google.com/feeds/list/' + id + '/' + sheet + '/public/values?alt=json';

        request(url, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var json = JSON.parse(response.body);
                var responseObj = {};
                var rows = [];
                const data = [] /* this array will eventually be populated with the contents of the spreadsheet's rows */
                if (json && json.feed && json.feed.entry) {
                    rows = json.feed.entry
                    for(const row of rows) {
                      const formattedRow = {}

                      for(const key in row) {
                        if(key.startsWith("gsx$")) {

                          /* The actual row names from your spreadsheet
                           * are formatted like "gsx$title".
                           * Therefore, we need to find keys in this object
                           * that start with "gsx$", and then strip that
                           * out to get the actual row name
                           */
                          let name = key.replace("gsx$", "");
                          if (!(name in _fields)) {
                            continue;
                          }
                          name = _fields[name]
                          formattedRow[name] = row[key].$t
                          if (name == 'size') {
                            formattedRow['size'] = Number(row[key].$t)
                          }
                          if (name == 'url') {
                            let link = getCorrectUrl(row[key].$t)
                            formattedRow['url'] = link
                            formattedRow['thumbUrl'] = link + "=w289"
                          }
                          if (name == 'path') {
                            currentPath = row[key].$t != "" ? row[key].$t : currentPath
                            formattedRow['path']  = currentPath
                          }
                        }
                      }
                      formattedRow['date'] = new Date().toLocaleString();
                      data.push(formattedRow)
                    }
                    return res.status(200).json({'files' : data});
                } else {
                    return res.status(response.statusCode).json(error);
                }
            } else {
                return res.status(200).json('No entries returned. Do you have the right ID?');
            }
        });
    } catch (error) {
        return res.status(500).json(error);
    }
};

function getCorrectUrl(link)
{
  try {
    var url = new URL(link);
    var id = url.searchParams.get("id");

    return "https://lh3.google.com/u/0/d/" + id;
  } catch(_) {
    
    return link;
  }
}
