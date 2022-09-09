
/**
 * Simple, blocking UDP client
 *
 * Saleem Bhatti
 * Sep 2019
 * Oct 2018
 *
 */

// https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/net/InetAddress.html
// https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/net/DatagramPacket.html
// https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/net/DatagramSocket.html

import java.io.*;
import java.net.*;

public class UdpClient1 {

  public static void main(String[] args)
  {
    if (args.length != 3) { // user has not provided arguments
      System.out.println("\n UdpClient1 <servername> <port> <string> \n");
      System.exit(0);
    }

    try {

      // parse input
      InetAddress addr = InetAddress.getByName(args[0]);
      int port = Integer.parseInt(args[1]);

      if (port < 0 || port > 65535) {
        System.err.println("Bad port number: " + args[1]);
        System.exit(0);
      }

      // create socket
      DatagramSocket client = new DatagramSocket();

      System.out.println("Sending to server");
      System.out.println("server: "
                          + addr.getHostName() + " "
                          + addr.getHostAddress());
      System.out.println("port: " + port);

      DatagramPacket packet =
      new DatagramPacket(args[2].getBytes(), args[2].length(), addr, port);

      client.send(packet);

      // close socket
      client.close();
    }
    catch (UnknownHostException e) {
      System.err.println("Unknown host: " + e.getMessage());
    }
    catch (SocketException e) {
      System.err.println("Socket problem: " + e.getMessage());
    }
    catch (IOException e) {
      System.err.println("IO problem: " + e.getMessage());
    }

  } // main()

} // class
