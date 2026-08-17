import java.util.List;

public final class FirstInOrderTest {
  private static int failures = 0;
  private static final List<String> LESSON =
      List.of("+report.pdf", "+photo.jpg", "-", "+notes.txt", "-", "-");

  private static void check(String name, boolean passed) {
    if (!passed) {
      System.out.println("FAIL " + name);
      failures++;
    }
  }

  public static void main(String[] args) {
    // The defining property, over several event sequences rather than one.
    List<List<String>> sequences =
        List.of(
            List.of("+a", "-"),
            LESSON,
            List.of("+a", "+b", "+c", "-", "-", "-"),
            List.of("+a", "-", "+b", "-", "+c", "-"));
    for (List<String> events : sequences) {
      check("served in arrival order",
          FirstInOrder.serveFirstIn(events).equals(FirstInOrder.arrivalsIn(events)));
    }

    check("the lesson order",
        FirstInOrder.serveFirstIn(LESSON)
            .equals(List.of("report.pdf", "photo.jpg", "notes.txt")));

    // The contrast the two lessons exist to draw, on identical input.
    check("a pile serves a different order",
        FirstInOrder.serveLastIn(LESSON)
            .equals(List.of("photo.jpg", "notes.txt", "report.pdf")));

    // notes.txt arrives after photo.jpg is already waiting and is served after
    // it. This is the step where the pile does the opposite.
    List<String> served = FirstInOrder.serveFirstIn(LESSON);
    List<String> piled = FirstInOrder.serveLastIn(LESSON);
    check("a late arrival does not overtake",
        served.indexOf("photo.jpg") < served.indexOf("notes.txt"));
    check("the pile serves the newer first",
        piled.indexOf("notes.txt") < piled.indexOf("report.pdf"));

    // Not "may be delayed": under alternating arrivals and services a pile
    // never serves the first item at all, for any number of rounds.
    for (int rounds : new int[] {1, 5, 50}) {
      List<String> events = FirstInOrder.steadyStream("first", rounds);
      check("a queue serves the first arrival",
          FirstInOrder.serveFirstIn(events).contains("first"));
      check("a pile starves it",
          !FirstInOrder.serveLastIn(events).contains("first"));
    }

    check("the queue serves it immediately",
        FirstInOrder.serveFirstIn(FirstInOrder.steadyStream("first", 5))
            .get(0)
            .equals("first"));

    check("serving an empty line does nothing",
        FirstInOrder.serveFirstIn(List.of("-", "-")).isEmpty());
    check("serving after an empty line still works",
        FirstInOrder.serveFirstIn(List.of("-", "+a", "-")).equals(List.of("a")));
    check("unserved arrivals are not served",
        FirstInOrder.serveFirstIn(List.of("+a", "+b", "-")).equals(List.of("a")));
    check("no events serve nobody",
        FirstInOrder.serveFirstIn(List.of()).isEmpty()
            && FirstInOrder.serveLastIn(List.of()).isEmpty());
    check("repeated names are ordinary",
        FirstInOrder.serveFirstIn(List.of("+job", "+job", "-", "-"))
            .equals(List.of("job", "job")));

    if (failures > 0) {
      System.exit(1);
    }
    System.out.println("All checks passed.");
  }
}
