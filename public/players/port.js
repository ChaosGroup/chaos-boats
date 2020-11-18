self.port = cb => (self.onmessage = ({ data }) => self.postMessage(cb(data)));
