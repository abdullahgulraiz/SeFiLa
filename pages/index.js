import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>SeFiLa</title>
        <meta name="description" content="Security Findings Labeler" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          {'{Se}'}curity {'{Fi}'}ndings {'{La}'}beler
        </h1>

        <p className={styles.description}>
          I would like to...
        </p>

        <div className={styles.grid}>
          <a href="/label" className={styles.card}>
            <h2>Label &rarr;</h2>
            <p>Collect findings from different security tools in one place.</p>
          </a>

          <a href="#" className={styles.card}>
            <h2>Evaluate &rarr;</h2>
            <p>Compare de-duplication results of a technique.<br />(Coming soon)</p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://github.com/abdullahgulraiz/SeFiLa"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.logo}>
            <Image src="/github.png" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}
